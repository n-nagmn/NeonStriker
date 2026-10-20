<?php
header('Content-Type: application/json');
$file = 'rankings.json';

// Initialize file if not exists
if (!file_exists($file)) {
    $default = [
        ["name" => "NTX", "score" => 25000],
        ["name" => "SYS", "score" => 15000],
        ["name" => "CYB", "score" => 5000]
    ];
    file_put_contents($file, json_encode($default));
    chmod($file, 0666);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['name']) && isset($input['score'])) {
        $name = substr(trim($input['name']), 0, 3);
        if ($name === '') $name = 'AAA';
        $score = intval($input['score']);
        
        $fp = fopen($file, 'c+');
        if (flock($fp, LOCK_EX)) {
            $size = filesize($file);
            $scores = [];
            if ($size > 0) {
                $scores = json_decode(fread($fp, $size), true) ?: [];
            }
            $scores[] = ["name" => $name, "score" => $score];
            usort($scores, function($a, $b) {
                return $b['score'] - $a['score'];
            });
            $scores = array_slice($scores, 0, 5);
            
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($scores));
            flock($fp, LOCK_UN);
        }
        fclose($fp);
        echo json_encode(["status" => "success", "scores" => $scores]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid data"]);
    }
} else {
    $scores = json_decode(file_get_contents($file), true) ?: [];
    echo json_encode(["status" => "success", "scores" => $scores]);
}
?>
