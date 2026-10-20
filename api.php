<?php
/**
 * NEON JUMP - API
 * actions:
 *  - GET  /neonjump/api.php?action=rank        上位ランキング取得 (limit, with_ghosts)
 *  - POST /neonjump/api.php  {action:record}   スコア記録
 *  - POST /neonjump/api.php  {action:ghost}    ゴースト軌跡記録 (score 高い順に保持)
 *  - GET  /neonjump/api.php?action=ghost&name= 指定プレイヤーのベストゴースト取得
 */
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$base = __DIR__;
$records_file = $base . '/records.json';
$ghosts_file  = $base . '/ghosts.json';
$lock_file    = $base . '/neonjump.lock';

function read_json($path, $default) {
    if (file_exists($path)) {
        $raw = file_get_contents($path);
        $d = json_decode($raw, true);
        if (is_array($d)) return $d;
    }
    return $default;
}

function write_json($path, $data) {
    $enc = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $tmp = $path . '.tmp';
    if (@file_put_contents($tmp, $enc) !== false) {
        @chmod($tmp, 0666);
        @rename($tmp, $path);
        return true;
    }
    @unlink($tmp);
    return false;
}

function lock_on() {
    global $lock_file;
    $fp = @fopen($lock_file, 'c');
    if ($fp) { @chmod($lock_file, 0666); }
    if (!$fp || !flock($fp, LOCK_EX)) {
        // ロック取得失敗: ロックなしで処理が進むのを防ぐため 503 を返す
        if ($fp) { fclose($fp); $fp = null; }
        http_response_code(503);
        echo json_encode(['status' => 'error', 'message' => 'server busy, please retry'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $fp;
}
function lock_off(&$fp) {
    if ($fp) {
        if (flock($fp, LOCK_UN)) {}
        fclose($fp);
        $fp = null;
    }
}

function clean_name($s) {
    $s = is_string($s) ? trim($s) : '';
    $s = mb_substr($s, 0, 20, 'UTF-8');
    return $s === '' ? '名無しランナー' : $s;
}

$raw_input = file_get_contents('php://input');
$decoded = json_decode($raw_input, true);
if (!is_array($decoded)) {
    $decoded = [];
}

$action = '';
if (isset($decoded['action']) && is_string($decoded['action'])) {
    $action = $decoded['action'];
} elseif (isset($_GET['action'])) {
    $action = $_GET['action'];
} elseif (isset($_POST['action'])) {
    $action = $_POST['action'];
}

// --- POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if ($action === 'record') {
        $name  = clean_name($decoded['name'] ?? '');
        $score = intval($decoded['score'] ?? 0);
        if ($score < 0 || $score > 999999) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'invalid score'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $fp = lock_on();
        $records = read_json($records_file, []);
        // 同名ならスコアが上なら更新、下なら無視
        $found = false;
        foreach ($records as &$r) {
            if ($r['name'] === $name) {
                if ($score > intval($r['score'])) {
                    $r['score'] = $score;
                    $r['ts'] = time();
                }
                $found = true;
                break;
            }
        }
        unset($r);
        if (!$found) {
            $records[] = ['name' => $name, 'score' => $score, 'ts' => time()];
        }
        // スコア降順ソートして上位100保持
        usort($records, function($a, $b) { return $b['score'] - $a['score']; });
        $kept = array_slice($records, 0, 100);
        // 切り落としたプレイヤーのゴーストも削除して整合性を保つ（ghost action と同じく）
        $dropped = array_slice($records, 100);
        if (count($dropped) > 0) {
            $droppedNames = [];
            foreach ($dropped as $r) {
                $droppedNames[] = $r['name'];
            }
            $ghosts = read_json($ghosts_file, []);
            $before = count($ghosts);
            $ghosts = array_values(array_filter($ghosts, function($g) use ($droppedNames) {
                return !in_array($g['name'] ?? '', $droppedNames, true);
            }));
            if (count($ghosts) !== $before) {
                write_json($ghosts_file, $ghosts);
            }
        }
        write_json($records_file, $kept);
        lock_off($fp);
        echo json_encode(['status' => 'success'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'ghost') {
        $name  = clean_name($decoded['name'] ?? '');
        $score = intval($decoded['score'] ?? 0);
        $frames = $decoded['frames'] ?? null;
        if (!is_array($frames) || count($frames) === 0 || count($frames) > 60000) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'invalid frames'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if ($score < 0 || $score > 999999) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'invalid score'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        // フレーム整形: [d(距離mm相当), y(画面座標), vy] の配列のみ保持
        $clean = [];
        foreach ($frames as $f) {
            if (is_array($f) && count($f) >= 3) {
                $clean[] = [
                    intval($f[0]),
                    intval($f[1]),
                    intval($f[2])
                ];
            }
        }
        if (count($clean) < 2) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'invalid frames'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        // サイズ上限(約1.5MB生JSON)なら古い順に破棄
        $fp = lock_on();
        $ghosts = read_json($ghosts_file, []);
        // 同名ならスコアが上の場合のみ上書き（ランキングとゴーストの整合性を保つ）
        $exists = false;
        foreach ($ghosts as $g) {
            if ($g['name'] === $name) {
                if ($score > intval($g['score'])) {
                    $g['score'] = $score;
                    $g['ts'] = time();
                    $g['frames'] = $clean;
                }
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $ghosts[] = ['name' => $name, 'score' => $score, 'ts' => time(), 'frames' => $clean];
        }
        // スコア降順
        usort($ghosts, function($a, $b) { return $b['score'] - $a['score']; });
        // サイズ管理: 合計生サイズが大きいと末尾から削除
        // O(n^2) の再エンコードを避けるため各エントリのサイズを事前計算し、合計を減算で管理
        $evicted = [];
        if (count($ghosts) > 0) {
            $encOpts = JSON_UNESCAPED_UNICODE;
            $entrySizes = array_map(function($g) use ($encOpts) {
                return strlen(json_encode($g, $encOpts));
            }, $ghosts);
            // 合計サイズ = "[]" + 区切り(",") 分 + 各エントリサイズ
            $n = count($ghosts);
            $totalSize = 2 + 2 * ($n - 1) + array_sum($entrySizes);
            while (count($ghosts) > 0 && $totalSize >= 1500000) {
                $lastSize = array_pop($entrySizes);
                // 末尾エントリを削除すると 3(「, 」分) + エントリサイズ が減る
                $totalSize -= 3 + $lastSize;
                $evicted[] = array_pop($ghosts)['name'];
            }
        }
        write_json($ghosts_file, $ghosts);
        // 破棄したゴーストのレコードも削除して整合性を保つ
        if (count($evicted) > 0) {
            $records = read_json($records_file, []);
            $before = count($records);
            $records = array_values(array_filter($records, function($r) use ($evicted) {
                return !in_array($r['name'] ?? '', $evicted, true);
            }));
            if (count($records) !== $before) {
                write_json($records_file, $records);
            }
        }
        lock_off($fp);
        echo json_encode(['status' => 'success'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'unknown action'], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- GET ---
if ($action === 'rank') {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $limit = max(1, min($limit, 100));
    $withGhosts = isset($_GET['with_ghosts']) && $_GET['with_ghosts'] === '1';

    $records = read_json($records_file, []);
    $ghosts = read_json($ghosts_file, []);
    
    // ゴーストを持つプレイヤーのみ対象（ゴーストなしのランキングは表示しない）
    $gmap = [];
    foreach ($ghosts as $g) {
        if (!isset($gmap[$g['name']]) && !empty($g['frames'])) {
            $gmap[$g['name']] = $g;
        }
    }
    
    // レコードとゴーストをマージ（ゴーストを持つプレイヤーのみ）
    $merged = [];
    foreach ($records as $r) {
        if (isset($gmap[$r['name']])) {
            $merged[] = [
                'name' => $r['name'],
                'score' => intval($r['score']),
                'ts' => $r['ts'],
                'ghost' => $gmap[$r['name']]['frames']
            ];
        }
    }
    
    // ゴーストしかない（レコード削除された）プレイヤーも追加
    foreach ($gmap as $name => $g) {
        $found = false;
        foreach ($merged as $m) {
            if ($m['name'] === $name) { $found = true; break; }
        }
        if (!$found) {
            $merged[] = [
                'name' => $name,
                'score' => intval($g['score']),
                'ts' => $g['ts'],
                'ghost' => $g['frames']
            ];
        }
    }
    
    // スコア降順ソート
    usort($merged, function($a, $b) { return $b['score'] - $a['score']; });
    $top = array_slice($merged, 0, $limit);

    echo json_encode(['status' => 'success', 'ranking' => $top], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'ghost') {
    $name = clean_name($_GET['name'] ?? '');
    $ghosts = read_json($ghosts_file, []);
    $found = null;
    foreach ($ghosts as $g) {
        if ($g['name'] === $name) { $found = $g; break; }
    }
    if ($found) {
        echo json_encode(['status' => 'success', 'name' => $found['name'], 'score' => $found['score'], 'frames' => $found['frames']], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'not found'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'unknown action'], JSON_UNESCAPED_UNICODE);
