// Constants
const SLOTS_COLS = 5;
const SLOTS_ROWS = 3;

const REEL_WIDTH = 256;
const SYMBOL_SIZE = 256;

// Application
let playfield;
let slotSprites;

let math;
fetch("./assets/configs/math.json")
  .then((response) => response.json())
  .then((json) => (math = json));

const app = new PIXI.Application({
  width: SYMBOL_SIZE * SLOTS_COLS,
  height: SYMBOL_SIZE * (SLOTS_ROWS + 1),
  backgroundColor: 0x1099bb,
});

document.body.appendChild(app.view);

const rootContainer = new PIXI.Container();
app.stage.addChild(rootContainer);

const reelContainer = new PIXI.Container();
rootContainer.addChild(reelContainer);

let loadingProgress = 0;
const loadingProgressText = new PIXI.Text(`Loading: ${loadingProgress}%`);
loadingProgressText.anchor.set(0.5);
loadingProgressText.x = app.screen.width / 2;
loadingProgressText.y = app.screen.height / 2;

rootContainer.addChild(loadingProgressText);

const totalWinText = new PIXI.Text("Total Wins: 0");
totalWinText.x = SYMBOL_SIZE;
totalWinText.y = SYMBOL_SIZE * 3 + 20;
rootContainer.addChild(totalWinText);

app.loader.baseUrl = "assets/img/";
app.loader
  .add("hv1_symbol", "hv1_symbol.png")
  .add("hv2_symbol", "hv2_symbol.png")
  .add("hv3_symbol", "hv3_symbol.png")
  .add("hv4_symbol", "hv4_symbol.png")
  .add("lv1_symbol", "lv1_symbol.png")
  .add("lv2_symbol", "lv2_symbol.png")
  .add("lv3_symbol", "lv3_symbol.png")
  .add("lv4_symbol", "lv4_symbol.png")
  .add("spin_button", "spin_button.png");
app.loader.onProgress.add(() => {
  loadingProgress = app.loader.progress.toPrecision(4);
  loadingProgressText.text = `Loading: ${loadingProgress}%`;
});
app.loader.onComplete.add((e) => {
  rootContainer.removeChild(loadingProgressText);
});

app.loader.load((loader, resources) => {
  for (let i = 0; i < SLOTS_COLS; ++i) {
    const reelStrip = math["reels"][i];
    const reel = new PIXI.Container();
    for (let j = 0; j < SLOTS_ROWS; ++j) {
      const symbol = PIXI.Sprite.from(
        resources[`${reelStrip[j]}_symbol`].texture
      );
      symbol.x = i * SYMBOL_SIZE;
      symbol.y = j * SYMBOL_SIZE;
      reel.addChild(symbol);
    }
    reelContainer.addChild(reel);
  }

  updatePlayfield([0, 0, 0, 0, 0]);

  // Spin Button
  const spinButton = PIXI.Sprite.from(resources.spin_button.texture);

  spinButton.x = SYMBOL_SIZE * 4;
  spinButton.y = SYMBOL_SIZE * 3;

  spinButton.interactive = true;
  spinButton.buttonMode = true;
  spinButton.addListener("pointerdown", () => {
    spin();
  });
  rootContainer.addChild(spinButton);
});

// Functions
const updatePlayfield = (stops) => {
  let tempPlayfield = [];
  for (let i = 0; i < SLOTS_COLS; ++i) {
    const reelStrip = math["reels"][i];
    const reelStripLength = math["reels"][i].length;
    const stop = stops[i];
    const landedSymbols = [];
    for (let j = 0; j < SLOTS_ROWS; ++j) {
      const symbol = reelStrip[(stop + j) % reelStripLength]
      landedSymbols.push(symbol);
      reelContainer.getChildAt(i).getChildAt(j).texture = app.loader.resources[`${symbol}_symbol`].texture
    }
    tempPlayfield.push(landedSymbols);
  }
  playfield = tempPlayfield;
};

const spin = () => {
  const stops = [0, 0, 0, 0, 0];
  for (let i = 0; i < SLOTS_COLS; ++i) {
    const reelStripLength = math["reels"][i].length;
    stops[i] = Math.floor(Math.random() * reelStripLength);
  }
  updatePlayfield(stops);

  const payouts = calculatePayout();
  const winnings = payouts[0];
  const totalWins = payouts[1];

  let winText = `Total Wins: ${totalWins}`
  if (totalWins > 0) {
    winnings.forEach((winning, index) => {
      winText += `\n Payline: ${winning.payline}, Symbols: ${winning.symbol} x${winning.symbolCount}, Amount: ${winning.payout}`
      console.log(
        `Payline: ${winning.payline}, Symbols: ${winning.symbol} x${winning.symbolCount}, Amount: ${winning.payout}`
      );
    });
  } 
  totalWinText.text = winText

};

const calculatePayout = () => {
  let winnings = [];
  let totalWins = 0;

  const paylines = math["paylines"];
  paylines.forEach((payline, index) => {
    let winningSymbol = "";
    let winning = 0;
    for (let i = 0; i < playfield.length; ++i) {
      let currentSymbol = playfield[i][payline[i]];
      if (currentSymbol !== winningSymbol) {
        if (winningSymbol == "") {
          winningSymbol = currentSymbol;
        } else {
          if (winning > 0) {
            winnings.push({
              payline: index + 1,
              symbol: winningSymbol,
              symbolCount: i,
              payout: winning,
            });
            totalWins += winning;
          }
          return;
        }
      } else {
        winning = math["payouts"][winningSymbol][i];
      }
    }
  });

  return [winnings, totalWins];
};
