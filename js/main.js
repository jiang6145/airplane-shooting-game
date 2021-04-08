// DOM Element
const $btnsWrap = $('#btns-wrap');
const $btnStart = $('.btn-start');
const $btnRule = $('.btn-rule');
const $ruleWrap = $('#rule-wrap');
const $textHighscore = $('.text-highscore');

const $game = $('#game');
const $player = $('.player');
const $playerBulletWrap = $('.player-bullet-wrap');
const $enemyWrap = $('.enemy-wrap');
const $enemyBulletWrap = $('.enemy-bullet-wrap');
const $supplyWrap = $('.supply-wrap');

const $textScore = $('.text-score');
const $textShootSpeed = $('.text-shoot-speed');
const $textArms = $('.text-arms');
const $textHp = $('.text-hp');

// variable for game
const playerData = {
  hp: 5,
  shootSpeed: 250, // 玩家射擊計時器間隔
  armsType: 'normal',
  shotgunNum: 0,
  shootTimer: null,
  score: 0
};
const createEnemyRange = {
  left: -100,
  right: $(window).width() + 100,
  top: -100,
  bottom: $(window).height() + 100
};
const supplyTypes = ['tonic', 'addShootSpeed', 'shotgun'];
const enemyTypes = ['enemy1', 'enemy2'];
const enemysData = []; // 存取敵人的數據 (計時器,血量...等)

let isInGame = false;
let isShoot = false;
let frameID = null; // requestAnimationFrame() return ID
let createEnemyTimer = null;
let highscoreStorage = JSON.parse(localStorage.getItem('airplane-shooting-highscore')) || 0;
$textHighscore.text(highscoreStorage);

// Function
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function playerStatusHp() {
  $textHp.html('');
  for (let i = 0; i < playerData.hp; i++) {
    $textHp.append(`<i></i>`);
  }
}

function playerStatusArmsType() {
  const armsTypeText = playerData.armsType === 'normal' ? '標準' : '散彈';
  const bulletNumText = playerData.armsType === 'normal' ? '∞' : playerData.shotgunNum;
  $textArms.text(`${armsTypeText}  ${bulletNumText}`);
}

// 刪除指定元素與數據
function clearHandler($el, datas) {
  if (datas) {
    clearInterval(datas[$el.index()].shootTimer);
    datas[$el.index()].shootTimer = null;
    datas.splice($el.index(), 1);
  }
  $el.stop().remove(); // 停止動畫再刪除元素, 否則還是會執行動畫
}

// 創建敵人, 兩種敵人類型隨機產生
function createEnemy() {
  if ($('.enemy').length > 15) return;
  const enemyType = enemyTypes[random(0, 1)];
  const $enemy = $(`<div class="enemy ${enemyType}"></div>`);
  $enemyWrap.append($enemy);
  if (enemyType === enemyTypes[0]) {
    // 敵人類型 1
    enemysData.push({
      hp: playerData.score < 1000 ? 8 : Math.floor(playerData.score / 100), // 敵人血量
      shootTimer: null, // 敵人射擊計時器
      lifeCycle: 1000
    });

    $enemy
      .css({ left: random(createEnemyRange.left, createEnemyRange.right), top: createEnemyRange.top })
      .stop()
      .animate({ left: random(100, $(window).width() - 100), top: random(50, createEnemyRange.bottom / 3) }, 5000);

    // 敵人開始射擊
    enemysData[enemysData.length - 1].shootTimer = setInterval(function () {
      enemyBullet($enemy, enemyType);
    }, 1500);
  } else {
    // 敵人類型 2
    const randomNum = Math.random();
    const initialX = randomNum > 0.5 ? createEnemyRange.left : createEnemyRange.right;
    const endX = randomNum > 0.5 ? createEnemyRange.right : createEnemyRange.left;

    enemysData.push({
      hp: playerData.score < 1000 ? 3 : Math.floor(playerData.score / 200),
      shootTimer: null
    });

    $enemy
      .css({ left: initialX, top: random(10, createEnemyRange.bottom / 4) })
      .stop()
      .animate({ left: endX, top: '+=200' }, 4000, function () {
        clearHandler($enemy, enemysData);
      });

    enemysData[enemysData.length - 1].shootTimer = setInterval(function () {
      enemyBullet($enemy, enemyType);
    }, 500);
  }
}

// 敵人射擊
function enemyBullet($enemy, enemyType) {
  const velocity = (createEnemyRange.bottom - parseInt($enemy.css('top'))) * 3; // 子彈動畫時間 => 子彈飛行速度
  if (enemyType === enemyTypes[0]) {
    // 敵人1 的子彈
    const emitNum = 4;
    for (let i = 0; i < emitNum; i++) {
      const $enemyBullet = $(`<div class="enemy-bullet"></div>`);
      const offset = i < emitNum / 2 ? (i % (emitNum / 2)) * 300 : (i % (emitNum / 2)) * -300; // 散彈, 計算左右子彈的偏移距離
      $enemyBulletWrap.append($enemyBullet);
      $enemyBullet
        .css({ left: $enemy.css('left'), top: $enemy.css('top') })
        .stop()
        .animate(
          { left: parseInt($enemy.css('left')) + offset, top: createEnemyRange.bottom },
          velocity,
          'linear',
          function () {
            clearHandler($enemyBullet);
          }
        );
    }
  } else {
    // 敵人2的子彈
    const $enemyBullet = $(`<div class="enemy-bullet"></div>`);
    $enemyBulletWrap.append($enemyBullet);
    $enemyBullet
      .css({ left: $enemy.css('left'), top: $enemy.css('top') })
      .stop()
      .animate({ top: createEnemyRange.bottom }, velocity, 'linear', function () {
        clearHandler($enemyBullet);
      });
  }
  const shootAudio = new Audio('./audio/enemy-shoot.wav');
  shootAudio.volume = 0.3;
  shootAudio.currentTime = 0;
  shootAudio.play();
}

// 補給品處理 ---------------------------------------------------------------------------------------------
function createSupply($enemy) {
  if (Math.random() < 0.6) return;
  const initialX = parseInt($enemy.css('left'));
  const initialY = parseInt($enemy.css('top'));
  const supplyType = supplyTypes[random(0, 2)];
  const $supply = $(`<div class="supply ${supplyType}"></div>`);
  $supplyWrap.append($supply);
  $supply
    .css({ left: initialX, top: initialY })
    .stop()
    .animate({ left: `+=${random(-500, 500)}`, top: `+=${random(200, 600)}` }, 8000)
    .fadeOut(1000, function () {
      clearHandler($supply);
    });
}
// 玩家處理 ---------------------------------------------------------------------------------------------
// 玩家射擊
function playerBullet() {
  const initialX = parseInt($player.css('left'));
  const initialY = parseInt($player.css('top'));
  const velocity = initialY - createEnemyRange.top * 3;
  if (playerData.armsType === 'normal') {
    // 玩家一般武器
    for (let i = 0; i < 2; i++) {
      const $playerBullet = $(`<div class="player-bullet"></div>`);
      const offset = i % 2 === 0 ? -20 : 20;
      $playerBulletWrap.append($playerBullet);
      $playerBullet
        .css({ left: initialX + offset, top: initialY })
        .stop()
        .animate({ top: 0 }, velocity, 'linear', function () {
          clearHandler($playerBullet);
        });
    }
  } else {
    // 玩家散彈武器
    const emitNum = 8;
    for (let i = 0; i < emitNum; i++) {
      const $playerBullet = $(`<div class="player-bullet"></div>`);
      const offset = i < emitNum / 2 ? (i % (emitNum / 2)) * 100 : (i % (emitNum / 2)) * -100; // 散彈, 計算左右子彈的偏移距離
      $playerBulletWrap.append($playerBullet);
      $playerBullet
        .css({ left: initialX, top: initialY })
        .stop()
        .animate({ left: initialX + offset, top: 0 }, velocity, 'linear', function () {
          clearHandler($playerBullet);
        });
      playerData.shotgunNum--;
    }
    if (playerData.shotgunNum <= 0) playerData.armsType = 'normal'; // 散彈武器沒子彈後變回 normal 武器
    playerStatusArmsType();
  }
  const shootAudio = new Audio('./audio/player-shoot.wav');
  shootAudio.currentTime = 0;
  shootAudio.play();
}

// 計算元素範圍
function computeRange($el) {
  return {
    left: $el.offset().left,
    right: $el.offset().left + $el.width(),
    top: $el.offset().top,
    bottom: $el.offset().top + $el.height()
  };
}

// 碰撞判斷
function collisionDecide($this, $that) {
  return (
    $this.left <= $that.right && $this.right >= $that.left && $this.top <= $that.bottom && $this.bottom >= $that.top
  );
}

// 遊戲結束
function gameEnd() {
  if (playerData.score > highscoreStorage) {
    localStorage.setItem('airplane-shooting-highscore', JSON.stringify(playerData.score.toFixed(2)));
    highscoreStorage = JSON.parse(localStorage.getItem('airplane-shooting-highscore'));
    $textHighscore.text(highscoreStorage);
  }
  // 關閉所有計時器
  clearInterval(createEnemyTimer);
  createEnemyTimer = null;
  cancelAnimationFrame(frameID);
  frameID = null;
  clearInterval(playerData.shootTimer);
  playerData.shootTimer = null;

  $btnsWrap.fadeIn();
  $game.fadeOut();
  $player.fadeOut();
  // 重置數據
  isInGame = false;
  playerData.hp = 5;
  playerData.shootSpeed = 300;
  playerData.armsType = 'normal';
  playerData.shotgunNum = 0;
  playerData.score = 0;
  // 刪除所有動態產生的元素與數據
  $('.enemy').each(function () {
    clearHandler($(this), enemysData);
  });
  $('.enemy-bullet').each(function () {
    clearHandler($(this));
  });
  $('.player-bullet').each(function () {
    clearHandler($(this));
  });
  $('.supply').each(function () {
    clearHandler($(this));
  });
}

// 遊戲畫面,碰撞判斷處理
function gameHandler() {
  const $playerRange = computeRange($player); //玩家飛機
  $('.enemy').each(function (index) {
    const $this = $(this); // $this => 敵人飛機
    // 處理敵人1 停留到生命週期歸 0 後飛走在刪除元素與數據
    if (enemysData[index].lifeCycle) {
      enemysData[index].lifeCycle--;
      if (enemysData[index].lifeCycle === 0) {
        clearInterval(enemysData[index].shootTimer);
        $this.stop().animate({ top: '+=400', width: 0, height: 0 }, 2000, function () {
          clearHandler($this, enemysData);
        });
      }
    }
  });
  // 處理敵人子彈
  $('.enemy-bullet').each(function () {
    const $this = $(this); // $this => 敵人子彈
    const $thisRange = computeRange($this);
    if (collisionDecide($thisRange, $playerRange)) {
      clearHandler($this);
      playerData.hp--;
      playerStatusHp();
      // 被擊中讓飛機閃一下白
      $player.css('background-image', `url('./images/player-attacked.png')`);
      setTimeout(() => {
        $player.css('background-image', `url('./images/player.png')`);
      }, 50);
      if (playerData.hp <= 0) {
        gameEnd();
      }
    }
  });

  // 處理玩家子彈
  $('.player-bullet').each(function () {
    const $this = $(this); // $this => 玩家子彈
    const $thisRange = computeRange($this);
    $('.enemy').each(function (index) {
      const $that = $(this); // $that => 敵人飛機
      const $thatRange = computeRange($that);
      if (collisionDecide($thisRange, $thatRange)) {
        const enemyType = $that.attr('class').slice(6);
        clearHandler($this);
        enemysData[index].hp--;
        $that.css('background-image', `url('./images/${enemyType}-attacked.png')`); // 被擊中讓飛機閃一下白
        // 擊中一次敵人 + 1分
        playerData.score += 10;
        $textScore.text(playerData.score.toFixed(2));
        setTimeout(() => {
          $that.css('background-image', `url('./images/${enemyType}.png')`);
        }, 100);
        if (enemysData[index].hp <= 0) {
          createSupply($that);
          clearHandler($that, enemysData);
          const dieAuido = new Audio('./audio/die.wav');
          dieAuido.volume = 0.3;
          dieAuido.play();
        }
      }
    });
  });

  // 處理補給品
  $('.supply').each(function () {
    const $this = $(this); // $this => 補給品
    const $thisRange = computeRange($this);
    if (collisionDecide($thisRange, $playerRange)) {
      if ($this.hasClass(supplyTypes[0]) && playerData.hp < 5) {
        playerData.hp++;
        playerStatusHp();
      } else if ($this.hasClass(supplyTypes[1]) && playerData.shootSpeed > 120) {
        playerData.shootSpeed -= 30;
        // 重啟玩家射擊的計時器
        if (!isShoot) return;
        clearInterval(playerData.shootTimer);
        playerData.shootTimer = null;
        playerBullet();
        playerData.shootTimer = setInterval(playerBullet, playerData.shootSpeed);
        $textShootSpeed.text(`${(1000 / playerData.shootSpeed).toFixed(1)} RPS`);
      } else if ($this.hasClass(supplyTypes[2])) {
        playerData.armsType = supplyTypes[2];
        playerData.shotgunNum += 300;
        playerStatusArmsType();
      }
      clearHandler($this);
    }
  });

  // 處理加分
  playerData.score += 0.016;
  $textScore.text(playerData.score.toFixed(2));

  if (isInGame) frameID = requestAnimationFrame(gameHandler);
}

// Button Start
$btnStart.on('click', function () {
  $btnsWrap.fadeOut();
  $game.fadeIn();
  $player.fadeIn();
  isInGame = true;
  createEnemyTimer = setInterval(createEnemy, random(500, 2000)); // 每 0.5~2秒 創建一次敵人
  frameID = requestAnimationFrame(gameHandler);
  // 初始化
  playerStatusHp();
  playerStatusArmsType();
  $textShootSpeed.text(`${(1000 / playerData.shootSpeed).toFixed(1)} RPS`); // 射擊速率每秒鐘射幾發, 單位 RPS (rounds per second)
  $textScore.text(playerData.score);

  const clickAudio = new Audio('./audio/button-click.wav');
  clickAudio.play();
});

// Button Rule
$btnRule.on('click', function () {
  $ruleWrap.stop().fadeToggle(1000);
});

// 鼠標與玩家飛機操作
$(window).on('mousemove', function (e) {
  if (!isInGame) return;
  $player.css({ left: e.clientX, top: e.clientY });
});

// 按住滑鼠左鍵射擊
$(window).on('mousedown', function (e) {
  if (!isInGame || isShoot || e.button !== 0) return;
  isShoot = true;
  playerBullet();
  playerData.shootTimer = setInterval(playerBullet, playerData.shootSpeed);
});

// 放開滑鼠左鍵停止射擊
$(window).on('mouseup', function (e) {
  if (!isInGame || !isShoot || e.button !== 0) return;
  isShoot = false;
  clearInterval(playerData.shootTimer);
  playerData.shootTimer = null;
});

// 瀏覽器視窗縮放
$(window).on('resize', function () {
  createEnemyRange.right = $(window).width() + 100;
  createEnemyRange.bottom = $(window).height() + 100;
});
