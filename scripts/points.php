<?php

$tmpPath = dirname(__DIR__) . '/tmp';
if (!file_exists($tmpPath)) {
    mkdir($tmpPath, 0777, true);
}
$tmpFile = $tmpPath . '/point.csv';
if (!file_exists($tmpFile)) {
    file_put_contents($tmpFile, file_get_contents('http://data.tainan.gov.tw/dataset/53fe0c36-d4f7-422f-90ff-a681edd2f042/resource/20bea80e-450c-4039-9523-8ac672727f47/download/gaugingstation71.csv'));
}

$csv = fopen($tmpFile, 'r');
fgetcsv($csv, 2048);
/*
 * Array
(
    [0] => ID
    [1] => 站碼
    [2] => 站名
    [3] => 河川分區
    [4] => 行政區
    [5] => 轄管單位
    [6] => 河川排水
    [7] => 經度(度)
    [8] => 經度(分)
    [9] => 經度(秒)
    [10] => 緯度(度)
    [11] => 緯度(分)
    [12] => 緯度(秒)
)
 */
$points = array();
while ($line = fgetcsv($csv, 2048)) {
    $latitude = $line[10] + ($line[11] / 60) + ($line[12] / 3600);
    $longitude = $line[7] + ($line[8] / 60) + ($line[9] / 3600);
    $points[$line[1]] = array(
        'code' => $line[1],
        'name' => $line[2],
        'type' => $line[3],
        'area' => $line[4],
        'admin' => $line[5],
        'river' => $line[6],
        'latitude' => $latitude,
        'longitude' => $longitude,
        'image' => '',
    );
}

$tmpFile = $tmpPath . '/cctv.csv';
if (!file_exists($tmpFile)) {
    file_put_contents($tmpFile, file_get_contents('http://data.tainan.gov.tw/dataset/5b495b9d-6fb1-4988-972b-7e94775c464a/resource/61358290-c792-4ea2-9bbd-6dda8f9cc45b/download/cctv.csv'));
}
/*
 * Array
Array
(
    [0] => 站碼
    [1] => 站名
    [2] => 河川分區
    [3] => 行政區
    [4] => 轄管單位
    [5] => 河川排水
    [6] => 經度(度)
    [7] => 經度(分)
    [8] => 經度(秒)
    [9] => 緯度(度)
    [10] => 緯度(分)
    [11] => 緯度(秒)
    [12] => 即時影像網址
)
 */
$csv = fopen($tmpFile, 'r');
fgetcsv($csv, 2048);
while ($line = fgetcsv($csv, 2048)) {
    $latitude = $line[9] + ($line[10] / 60) + ($line[11] / 3600);
    $longitude = $line[6] + ($line[7] / 60) + ($line[8] / 3600);
    $points[$line[0]] = array(
        'code' => $line[0],
        'name' => $line[1],
        'type' => $line[2],
        'area' => $line[3],
        'admin' => $line[4],
        'river' => $line[5],
        'latitude' => $latitude,
        'longitude' => $longitude,
        'image' => $line[12],
    );
}

file_put_contents(dirname(__DIR__) . '/points.json', json_encode($points, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
