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

// 入力ボディのサイズ上限（約2MB）。json_decode 前にチェックする
const MAX_BODY_SIZE = 2 * 1024 * 1024;

// read_json に渡すバリデータ: 必須キーを満たさないエントリを除外する
function validate_records($d) {
    if (!is_array($d)) return [];
    $out = [];
    foreach ($d as $r) {
        if (is_array($r) && isset($r['name'], $r['score']) && is_string($r['name']) && $r['name'] !== '') {
            $out[] = $r;
        }
    }
    return $out;
}
function validate_ghosts($d) {
    if (!is_array($d)) return [];
    $out = [];
    foreach ($d as $g) {
        if (is_array($g) && isset($g['name'], $g['score'], $g['frames']) && is_string($g['name']) && $g['name'] !== '' && is_array($g['frames'])) {
            $out[] = $g;
        }
    }
    return $out;
}

function read_json($path, $default, $validator = null) {
    if (file_exists($path)) {
        $raw = file_get_contents($path);
        if ($raw !== false && $raw !== '' && strlen($raw) <= MAX_BODY_SIZE) {
            $d = json_decode($raw, true);
            if (is_array($d)) {
                return $validator ? $validator($d) : $d;
            }
        }
    }
    return $default;
}

function write_json($path, $data) {
    $enc = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($enc === false) {
        // エンコード失敗: ターゲットファイルを一切変更しない
        return false;
    }
    $tmp = $path . '.tmp';
    if (@file_put_contents($tmp, $enc) !== false) {
        // リネーム前にテンポラリが正常に書き込まれているか確認
        $sz = @filesize($tmp);
        if ($sz === false || $sz <= 0) {
            @unlink($tmp);
            return false;
        }
        @chmod($tmp, 0666);
        if (!@rename($tmp, $path)) {
            @unlink($tmp);
            return false;
        }
        return true;
    }
    @unlink($tmp);
    return false;
}

function fail_500($msg) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
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
    $s = is_string($s) ? $s : '';
    // 制御文字・C0/C1・DEL を除去（innerHTML 注入・ログ改行防止）
    $s = preg_replace('/[\x00-\x1F\x7F\x{0080}-\x{009F}]/u', '', $s);
    $s = trim($s);
    $s = mb_substr($s, 0, 20, 'UTF-8');
    return $s === '' ? '名無しランナー' : $s;
}

// --- per-name 送信クールダウン（連打・リプレイアブルな POST を抑制） ---
const POST_COOLDOWN_SEC = 2;
function cooldown_ok($name, $ttl) {
    global $base;
    $key_file = $base . '/cd_' . substr(md5($name), 0, 16) . '.lock';
    $now = time();
    if (file_exists($key_file)) {
        $m = @filemtime($key_file);
        if ($m !== false && ($now - $m) < $ttl) {
            return false;
        }
    }
    $fp = @fopen($key_file, 'c');
    if ($fp) { @chmod($key_file, 0666); fclose($fp); }
    return true;
}

$raw_input = file_get_contents('php://input');
// H5: ボディサイズ上限を json_decode より前にチェック
if ($raw_input === false || strlen($raw_input) > MAX_BODY_SIZE) {
    http_response_code(413);
    echo json_encode(['status' => 'error', 'message' => 'payload too large'], JSON_UNESCAPED_UNICODE);
    exit;
}
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
        // H5: 同名のクールダウン中は更新をスキップ（データは変更しない）
        if (!cooldown_ok($name, POST_COOLDOWN_SEC)) {
            echo json_encode(['status' => 'success', 'skipped' => 'cooldown'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $fp = lock_on();
        $records = read_json($records_file, [], 'validate_records');
        // 同名ならスコアが上なら更新、下なら無視
        $found = false;
        foreach ($records as &$r) {
            if (($r['name'] ?? '') === $name) {
                if ($score > intval($r['score'] ?? 0)) {
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
        usort($records, function($a, $b) { return intval($b['score'] ?? 0) - intval($a['score'] ?? 0); });
        $kept = array_slice($records, 0, 100);
        // H2: レコードとゴーストは独立したストアとして扱う。
        // レコードの排出時にゴーストを削除しない（データ削除の禁止）。
        if (!write_json($records_file, $kept)) {
            lock_off($fp);
            fail_500('failed to save record');
        }
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
        // H5: 同名のクールダウン中は更新をスキップ（データは変更しない）
        if (!cooldown_ok($name, POST_COOLDOWN_SEC)) {
            echo json_encode(['status' => 'success', 'skipped' => 'cooldown'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        // H3: 参照高さ (ref, px) を必須化。y は ref 基準の画面座標 (上を負) で保存し、
        // 再生時は記録された ref を使って再現する（解像度非依存）
        $ref = isset($decoded['ref']) ? intval($decoded['ref']) : 0;
        if ($ref < 0 || $ref > 100000) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'invalid ref'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        // フレーム整形: [d(距離mm相当), y(ref基準の画面座標), vy] の配列のみ保持
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
        $ghosts = read_json($ghosts_file, [], 'validate_ghosts');
        // 同名ならスコアが上の場合のみ上書き
        $exists = false;
        foreach ($ghosts as &$g) {
            if (($g['name'] ?? '') === $name) {
                if ($score > intval($g['score'] ?? 0)) {
                    $g['score'] = $score;
                    $g['ts'] = time();
                    $g['frames'] = $clean;
                    $g['ref'] = $ref;
                }
                $exists = true;
                break;
            }
        }
        unset($g);
        if (!$exists) {
            $ghosts[] = ['name' => $name, 'score' => $score, 'ts' => time(), 'frames' => $clean, 'ref' => $ref];
        }
        // スコア降順
        usort($ghosts, function($a, $b) { return intval($b['score'] ?? 0) - intval($a['score'] ?? 0); });
        // サイズ管理: 合計生サイズが大きいと末尾から削除（ゴーストのみ。レコードは独立で削除しない）
        // O(n^2) の再エンコードを避けるため各エントリのサイズを事前計算し、合計を減算で管理
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
                array_pop($ghosts);
            }
        }
        if (!write_json($ghosts_file, $ghosts)) {
            lock_off($fp);
            fail_500('failed to save ghost');
        }
        // H2: ゴーストとレコードは独立したストアとして扱う。
        // ゴーストの破棄時にレコードを削除しない（データ削除の禁止）。
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

    $records = read_json($records_file, [], 'validate_records');
    $ghosts = read_json($ghosts_file, [], 'validate_ghosts');

    // ゴーストを持つプレイヤーのみ対象（ゴーストなしのランキングは表示しない）
    $gmap = [];
    foreach ($ghosts as $g) {
        $gn = $g['name'] ?? '';
        if ($gn !== '' && !isset($gmap[$gn]) && !empty($g['frames'])) {
            $gmap[$gn] = $g;
        }
    }

    // レコードとゴーストをマージ（ゴーストを持つプレイヤーのみ）
    $merged = [];
    foreach ($records as $r) {
        $rn = $r['name'] ?? '';
        if ($rn !== '' && isset($gmap[$rn])) {
            $merged[] = [
                'name' => $rn,
                'score' => intval($r['score'] ?? 0),
                'ts' => intval($r['ts'] ?? 0),
                'ghost' => $gmap[$rn]['frames'],
                'ref' => intval($gmap[$rn]['ref'] ?? 0)
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
                'score' => intval($g['score'] ?? 0),
                'ts' => intval($g['ts'] ?? 0),
                'ghost' => $g['frames'],
                'ref' => intval($g['ref'] ?? 0)
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
    $ghosts = read_json($ghosts_file, [], 'validate_ghosts');
    $found = null;
    foreach ($ghosts as $g) {
        if (($g['name'] ?? '') === $name) { $found = $g; break; }
    }
    if ($found) {
        echo json_encode([
            'status' => 'success',
            'name' => $found['name'] ?? '',
            'score' => intval($found['score'] ?? 0),
            'frames' => $found['frames'] ?? [],
            'ref' => intval($found['ref'] ?? 0)
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'not found'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'unknown action'], JSON_UNESCAPED_UNICODE);
