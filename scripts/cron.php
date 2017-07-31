<?php
$rootPath = dirname(__DIR__);
$jsonPath = $rootPath . '/json';
if(!file_exists($jsonPath)) {
  mkdir($jsonPath, 0777, true);
}

$now = date('Y-m-d H:i:s');

exec("cd {$rootPath} && /usr/bin/git pull");

$rivers = array('1580', '1590', '1600', '1630', '1650', '1660');
foreach($rivers AS $river) {
  file_put_contents($jsonPath . '/' . $river . '.json', file_get_contents('http://210.61.23.112/tainanwatermobile/TainanLocalWst/GetLocalWstWarnInfo.aspx?basin=' . $river));
}

exec("cd {$rootPath} && /usr/bin/git add -A");

exec("cd {$rootPath} && /usr/bin/git commit --author 'auto commit <noreply@localhost>' -m 'auto update @ {$now}'");

exec("cd {$rootPath} && /usr/bin/git push origin gh-pages");
