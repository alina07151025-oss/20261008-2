let quizCanvas; // 儲存 p5.js 畫布物件
let currentQuestion = 0; // 記錄目前題目索引
let selectedOption = -1; // 記錄目前選取的選項索引
let submitted = false; // 記錄目前題目是否已提交
let finished = false; // 記錄測驗是否已完成
let score = 0; // 記錄答對題數
let userAnswers = []; // 儲存每一題的使用者答案
let noticeText = ""; // 儲存未選答案時的提示文字
let lastPointerTime = -1000; // 記錄上一次指標事件時間
const CORRECT_WRONG_COLOR = "#bc6c25"; // 定義答錯時正確答案的指定背景色
const WRONG_OPTION_COLOR = "#ffc8dd"; // 定義答錯選項的指定背景色
const questions = [ // 建立固定五題的題庫
  { question: "p5.js 中，setup() 函式通常用來做什麼？", options: ["每一幀重複繪圖", "執行初始設定並建立畫布", "只處理鍵盤事件", "清除所有網頁元素"], answer: 1 }, // 建立第一題並設定四個選項
  { question: "p5.js 中，draw() 函式通常有什麼作用？", options: ["只在載入時執行一次", "持續重複執行以更新畫面", "只用來建立矩形", "只在滑鼠按下時執行"], answer: 1 }, // 建立第二題並設定四個選項
  { question: "哪一行程式碼可以建立寬 400、高 300 的畫布？", options: ["makeCanvas(400, 300);", "canvas(400, 300);", "createCanvas(400, 300);", "newCanvas(400, 300);"], answer: 2 }, // 建立第三題並設定四個選項
  { question: "哪一組指令可以先設定填色，再畫出矩形？", options: ["fill();、rect();", "rect();、fill();", "ellipse();、setup();", "draw();、mousePressed();"], answer: 0 }, // 建立第四題並設定四個選項
  { question: "mousePressed() 函式通常會在什麼時候被呼叫？", options: ["每一個動畫影格開始時", "使用者按下滑鼠或觸控畫面時", "建立畫布之前", "視窗尺寸改變時"], answer: 1 } // 建立第五題並設定四個選項
]; // 結束固定五題題庫

function setup() { // 定義 p5.js 初始化函式
  quizCanvas = createCanvas(windowWidth, windowHeight); // 使用視窗寬高建立全螢幕畫布
  quizCanvas.style("display", "block"); // 移除畫布下方的空白間隙
  quizCanvas.style("touch-action", "none"); // 停止瀏覽器預設觸控捲動行為
  quizCanvas.elt.setAttribute("aria-label", "p5.js 簡易指令練習測驗"); // 設定畫布無障礙描述
  textFont("Arial, Noto Sans TC, sans-serif"); // 設定支援中英文的字型
  textAlign(LEFT, TOP); // 設定預設文字對齊方式
  textWrap(WORD); // 啟用文字自動換行
  rectMode(CORNER); // 設定矩形使用左上角座標
  noStroke(); // 設定預設不繪製外框
} // 結束初始化函式

function draw() { // 定義每一個動畫影格執行的函式
  background("#f7f3ee"); // 清除畫面並設定暖色背景
  if (finished) { // 判斷是否已完成全部題目
    drawResultPage(); // 繪製測驗結果頁面
  } else { // 執行尚未完成測驗的分支
    drawQuizPage(); // 繪製目前單一題目頁面
  } // 結束測驗完成狀態判斷
} // 結束繪圖函式

function windowResized() { // 定義瀏覽器視窗尺寸變更函式
  resizeCanvas(windowWidth, windowHeight); // 依照最新視窗寬高調整全螢幕畫布
} // 結束視窗尺寸變更函式

function getLayout() { // 計算目前畫面的響應式版面
  const compact = width < 620 || height < 700; // 判斷是否使用緊湊版面
  const margin = width < 620 ? 18 : min(70, width * 0.08); // 計算左右邊界
  const contentWidth = max(220, width - margin * 2); // 計算內容區域寬度
  const headerHeight = compact ? 86 : 112; // 計算標題區高度
  const questionY = headerHeight + 52; // 計算題目卡片垂直位置
  const questionHeight = compact ? 92 : 112; // 計算題目卡片高度
  const optionsY = questionY + questionHeight + (compact ? 12 : 18); // 計算選項起始位置
  const optionGap = compact ? 8 : 11; // 計算選項間距
  const optionHeight = compact ? 48 : 60; // 計算每個選項高度
  const optionsBottom = optionsY + optionHeight * 4 + optionGap * 3; // 計算選項區底部
  const feedbackY = optionsBottom + (compact ? 12 : 18); // 計算提示區位置
  const feedbackHeight = compact ? 58 : 72; // 計算提示區高度
  const buttonY = submitted ? feedbackY + feedbackHeight + (compact ? 10 : 16) : feedbackY; // 計算按鈕位置
  const buttonHeight = compact ? 46 : 52; // 計算按鈕高度
  return { compact, margin, contentWidth, headerHeight, questionY, questionHeight, optionsY, optionGap, optionHeight, feedbackY, feedbackHeight, buttonY, buttonHeight }; // 回傳版面設定
} // 結束版面計算函式

function drawQuizPage() { // 定義繪製單題測驗頁面的函式
  const layout = getLayout(); // 取得響應式版面設定
  const questionData = questions[currentQuestion]; // 取得目前題目資料
  drawHeader(layout); // 繪製標題區域
  fill("#606c38"); // 設定進度文字顏色
  textStyle(BOLD); // 設定進度文字為粗體
  textSize(layout.compact ? 13 : 15); // 設定進度文字大小
  text("第 " + (currentQuestion + 1) + " 題 / 共 " + questions.length + " 題", layout.margin, layout.headerHeight + 10); // 顯示目前題號
  fill("#e9edc9"); // 設定進度條底色
  rect(layout.margin, layout.headerHeight + 32, layout.contentWidth, 7, 4); // 繪製進度條底色
  fill(CORRECT_WRONG_COLOR); // 設定進度條目前進度顏色
  rect(layout.margin, layout.headerHeight + 32, layout.contentWidth * ((currentQuestion + 1) / questions.length), 7, 4); // 繪製目前進度
  drawQuestionCard(layout, questionData); // 繪製題目卡片
  for (let index = 0; index < questionData.options.length; index += 1) { // 逐一繪製四個選項
    const optionY = layout.optionsY + index * (layout.optionHeight + layout.optionGap); // 計算選項原始垂直位置
    drawOption(index, questionData.options[index], layout.margin, optionY, layout.contentWidth, layout.optionHeight); // 繪製目前選項
  } // 結束四個選項迴圈
  if (submitted) { // 判斷目前題目是否已提交
    drawFeedback(layout, questionData); // 顯示答題結果提示
  } else { // 執行尚未提交的分支
    drawHint(layout); // 顯示操作提示
  } // 結束提交狀態判斷
  drawNextButton(layout); // 繪製下一題按鈕
} // 結束單題頁面繪製函式

function drawHeader(layout) { // 定義繪製標題區域的函式
  fill("#283618"); // 設定標題區背景色
  rect(0, 0, width, layout.headerHeight); // 繪製全寬標題區域
  fill("#dda15e"); // 設定裝飾圓形顏色
  ellipse(width - 34, 22, 86, 86); // 繪製右上裝飾圓形
  fill(CORRECT_WRONG_COLOR); // 設定第二個裝飾圓形顏色
  ellipse(width - 92, layout.headerHeight - 18, 46, 46); // 繪製右下裝飾圓形
  fill("#fefae0"); // 設定標題文字顏色
  textStyle(BOLD); // 設定標題文字為粗體
  textSize(layout.compact ? 21 : 28); // 設定標題文字大小
  text("p5.js 簡易指令練習測驗", layout.margin, layout.compact ? 18 : 25); // 顯示測驗標題
  fill("#faedcd"); // 設定副標題文字顏色
  textStyle(NORMAL); // 設定副標題文字為一般字體
  textSize(layout.compact ? 13 : 15); // 設定副標題文字大小
  text("每題四個選項，逐題完成五題挑戰", layout.margin, layout.compact ? 52 : 68); // 顯示測驗副標題
} // 結束標題繪製函式

function drawQuestionCard(layout, questionData) { // 定義繪製題目卡片的函式
  fill("#d6cdbd"); // 設定題目卡片陰影顏色
  rect(layout.margin + 3, layout.questionY + 4, layout.contentWidth, layout.questionHeight, 16); // 繪製題目卡片陰影
  fill("#ffffff"); // 設定題目卡片背景色
  rect(layout.margin, layout.questionY, layout.contentWidth, layout.questionHeight, 16); // 繪製題目卡片主體
  fill(CORRECT_WRONG_COLOR); // 設定題目標籤顏色
  textStyle(BOLD); // 設定題目標籤為粗體
  textSize(layout.compact ? 12 : 14); // 設定題目標籤大小
  text("QUESTION", layout.margin + 18, layout.questionY + 14); // 顯示題目標籤
  fill("#283618"); // 設定題目文字顏色
  textStyle(NORMAL); // 設定題目文字為一般字體
  textSize(layout.compact ? 16 : 20); // 設定題目文字大小
  textLeading(layout.compact ? 21 : 26); // 設定題目文字行距
  text(questionData.question, layout.margin + 18, layout.questionY + 39, layout.contentWidth - 36, layout.questionHeight - 45); // 顯示題目內容
} // 結束題目卡片繪製函式

function getOptionMotion(index) { // 計算選項答錯後的動畫位移
  const questionData = questions[currentQuestion]; // 取得目前題目資料
  const wrongAnswer = submitted && selectedOption !== questionData.answer; // 判斷使用者是否答錯
  if (!wrongAnswer) { // 判斷是否不需要動畫
    return { x: 0, y: 0 }; // 回傳無位移結果
  } // 結束無動畫判斷
  if (index === questionData.answer) { // 判斷目前選項是否為正確答案
    return { x: 0, y: sin(millis() / 160) * 10 }; // 讓正確答案上下跳動
  } // 結束正確答案動畫判斷
  return { x: sin(millis() / 135 + index) * 10, y: 0 }; // 讓所有錯誤選項左右移動
} // 結束選項動畫位移函式

function drawOption(index, optionText, x, y, optionWidth, optionHeight) { // 定義繪製單一選項的函式
  const questionData = questions[currentQuestion]; // 取得目前題目資料
  const isSelected = selectedOption === index; // 判斷選項是否被選取
  const isCorrect = index === questionData.answer; // 判斷選項是否為正確答案
  const wrongAnswer = submitted && selectedOption !== questionData.answer; // 判斷使用者是否答錯
  const motion = getOptionMotion(index); // 取得目前選項的動畫位移
  const drawX = x + motion.x; // 計算選項實際水平位置
  const drawY = y + motion.y; // 計算選項實際垂直位置
  let optionColor = "#ffffff"; // 設定選項預設背景色
  let borderColor = "#ccd5ae"; // 設定選項預設邊框色
  if (wrongAnswer && isCorrect) { // 判斷答錯時的正確答案選項
    optionColor = CORRECT_WRONG_COLOR; // 套用指定的正確答案背景色
    borderColor = "#8f4f1d"; // 設定正確答案邊框色
  } else if (wrongAnswer && !isCorrect) { // 判斷答錯時的錯誤選項
    optionColor = WRONG_OPTION_COLOR; // 套用指定的錯誤選項背景色
    borderColor = "#e58aaa"; // 設定錯誤選項邊框色
  } else if (submitted && isCorrect) { // 判斷答對後的正確答案選項
    optionColor = "#d9eddb"; // 設定答對時的淡綠背景色
    borderColor = "#588157"; // 設定答對時的綠色邊框
  } else if (isSelected) { // 判斷尚未提交時的已選選項
    optionColor = "#faedcd"; // 設定已選選項背景色
    borderColor = CORRECT_WRONG_COLOR; // 設定已選選項邊框色
  } // 結束選項背景判斷
  fill("#d6cdbd"); // 設定選項陰影顏色
  rect(drawX + 3, drawY + 4, optionWidth, optionHeight, 12); // 繪製選項陰影
  fill(optionColor); // 套用選項背景色
  rect(drawX, drawY, optionWidth, optionHeight, 12); // 繪製選項主體
  noFill(); // 暫時取消填色
  stroke(borderColor); // 設定選項邊框顏色
  strokeWeight(isSelected || submitted && isCorrect ? 2.5 : 1.5); // 設定選項邊框粗細
  rect(drawX, drawY, optionWidth, optionHeight, 12); // 繪製選項邊框
  noStroke(); // 恢復不繪製外框設定
  fill(wrongAnswer && isCorrect ? "#ffffff" : "#606c38"); // 設定選項字母背景文字色
  ellipse(drawX + 28, drawY + optionHeight / 2, 24, 24); // 繪製選項字母圓形標記
  fill(wrongAnswer && isCorrect ? CORRECT_WRONG_COLOR : "#ffffff"); // 設定選項字母文字顏色
  textAlign(CENTER, CENTER); // 將選項字母置中對齊
  textStyle(BOLD); // 設定選項字母為粗體
  textSize(12); // 設定選項字母大小
  text(String.fromCharCode(65 + index), drawX + 28, drawY + optionHeight / 2 + 1); // 顯示選項英文字母
  fill(wrongAnswer && isCorrect ? "#ffffff" : "#283618"); // 設定選項內容文字顏色
  textAlign(LEFT, TOP); // 將選項內容靠左上對齊
  textStyle(NORMAL); // 設定選項內容為一般字體
  textSize(optionHeight < 52 ? 14 : 16); // 設定選項內容文字大小
  text(optionText, drawX + 52, drawY + 12, optionWidth - 68, optionHeight - 18); // 顯示選項內容
} // 結束單一選項繪製函式

function drawHint(layout) { // 定義繪製尚未提交提示的函式
  fill(noticeText === "" ? "#7c806b" : "#9d174d"); // 依照提示狀態設定提示顏色
  textStyle(NORMAL); // 設定提示文字為一般字體
  textSize(layout.compact ? 12 : 14); // 設定提示文字大小
  text(noticeText === "" ? "請選擇答案，再按下下一題按鈕。" : noticeText, layout.margin, layout.feedbackY + 8, layout.contentWidth, 28); // 顯示操作提示
} // 結束操作提示函式

function drawFeedback(layout, questionData) { // 定義繪製答題結果的函式
  const correct = selectedOption === questionData.answer; // 判斷本題是否答對
  fill(correct ? "#e8f3e9" : "#fff0f3"); // 依照結果設定提示區背景色
  rect(layout.margin, layout.feedbackY, layout.contentWidth, layout.feedbackHeight, 12); // 繪製答題結果提示區
  fill(correct ? "#386641" : "#9d174d"); // 依照結果設定提示文字顏色
  textStyle(BOLD); // 設定結果文字為粗體
  textSize(layout.compact ? 14 : 16); // 設定結果文字大小
  text(correct ? "回答正確！" : "回答錯誤！請觀察正確答案的跳動提示。", layout.margin + 16, layout.feedbackY + 12); // 顯示答題結果
} // 結束答題結果函式

function drawNextButton(layout) { // 定義繪製下一題按鈕的函式
  const buttonColor = submitted ? "#606c38" : selectedOption === -1 ? "#a3a88a" : CORRECT_WRONG_COLOR; // 依照狀態設定按鈕顏色
  fill(buttonColor); // 套用按鈕背景色
  rect(layout.margin, layout.buttonY, layout.contentWidth, layout.buttonHeight, 12); // 繪製下一題按鈕
  fill("#ffffff"); // 設定按鈕文字顏色
  textAlign(CENTER, CENTER); // 將按鈕文字置中對齊
  textStyle(BOLD); // 設定按鈕文字為粗體
  textSize(layout.compact ? 15 : 17); // 設定按鈕文字大小
  const label = submitted && currentQuestion === questions.length - 1 ? "查看測驗結果" : "下一題"; // 設定按鈕顯示文字
  text(label, width / 2, layout.buttonY + layout.buttonHeight / 2 + 1); // 顯示下一題按鈕文字
  textAlign(LEFT, TOP); // 恢復文字靠左上對齊
  textStyle(NORMAL); // 恢復一般文字樣式
} // 結束下一題按鈕函式

function drawResultPage() { // 定義繪製測驗結果頁面的函式
  const layout = getLayout(); // 取得響應式版面設定
  drawHeader(layout); // 繪製結果頁標題區域
  const cardY = layout.headerHeight + 34; // 計算結果卡片位置
  const cardHeight = layout.compact ? 142 : 166; // 計算結果卡片高度
  fill("#d6cdbd"); // 設定結果卡片陰影顏色
  rect(layout.margin + 3, cardY + 4, layout.contentWidth, cardHeight, 16); // 繪製結果卡片陰影
  fill("#ffffff"); // 設定結果卡片背景色
  rect(layout.margin, cardY, layout.contentWidth, cardHeight, 16); // 繪製結果卡片主體
  fill(CORRECT_WRONG_COLOR); // 設定結果標題顏色
  textAlign(CENTER, CENTER); // 將結果標題置中對齊
  textStyle(BOLD); // 設定結果標題為粗體
  textSize(layout.compact ? 18 : 22); // 設定結果標題大小
  text("測驗完成！", width / 2, cardY + 28); // 顯示完成訊息
  fill("#283618"); // 設定分數文字顏色
  textSize(layout.compact ? 34 : 44); // 設定分數文字大小
  text("你答對 " + score + " / " + questions.length + " 題", width / 2, cardY + (layout.compact ? 73 : 86)); // 顯示答對題數
  fill("#7c806b"); // 設定結果說明文字顏色
  textStyle(NORMAL); // 設定結果說明為一般字體
  textSize(layout.compact ? 12 : 14); // 設定結果說明文字大小
  text("點選下方按鈕即可重新挑戰。", width / 2, cardY + (layout.compact ? 117 : 136)); // 顯示重新測驗說明
  const restartY = cardY + cardHeight + 24; // 計算重新測驗按鈕位置
  fill("#606c38"); // 設定重新測驗按鈕背景色
  rect(layout.margin, restartY, layout.contentWidth, layout.buttonHeight, 12); // 繪製重新測驗按鈕
  fill("#ffffff"); // 設定重新測驗文字顏色
  textStyle(BOLD); // 設定重新測驗文字為粗體
  textSize(layout.compact ? 15 : 17); // 設定重新測驗文字大小
  text("重新測驗", width / 2, restartY + layout.buttonHeight / 2 + 1); // 顯示重新測驗按鈕文字
  textAlign(LEFT, TOP); // 恢復文字靠左上對齊
  textStyle(NORMAL); // 恢復一般文字樣式
} // 結束結果頁面函式

function pointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) { // 定義矩形點擊範圍判斷函式
  return pointX >= rectX && pointX <= rectX + rectWidth && pointY >= rectY && pointY <= rectY + rectHeight; // 回傳點是否位於矩形內
} // 結束矩形範圍判斷函式

function handlePointerPress() { // 定義滑鼠與觸控共用的點擊處理函式
  const now = millis(); // 取得目前事件時間
  if (now - lastPointerTime < 250) { // 判斷是否為滑鼠與觸控重複事件
    return; // 忽略短時間重複事件
  } // 結束重複事件判斷
  lastPointerTime = now; // 記錄此次有效事件時間
  if (finished) { // 判斷目前是否顯示結果頁
    const layout = getLayout(); // 取得結果頁版面設定
    const restartY = layout.headerHeight + 34 + (layout.compact ? 142 : 166) + 24; // 計算重新測驗按鈕位置
    if (pointInRect(mouseX, mouseY, layout.margin, restartY, layout.contentWidth, layout.buttonHeight)) { // 判斷是否點擊重新測驗按鈕
      resetQuiz(); // 執行重新測驗功能
    } // 結束重新測驗點擊判斷
    return; // 結束結果頁點擊處理
  } // 結束結果頁狀態判斷
  const layout = getLayout(); // 取得測驗頁版面設定
  const questionData = questions[currentQuestion]; // 取得目前題目資料
  if (!submitted) { // 判斷目前題目是否尚未提交
    for (let index = 0; index < questionData.options.length; index += 1) { // 逐一檢查四個選項
      const optionY = layout.optionsY + index * (layout.optionHeight + layout.optionGap); // 計算選項垂直位置
      if (pointInRect(mouseX, mouseY, layout.margin, optionY, layout.contentWidth, layout.optionHeight)) { // 判斷是否點擊選項
        selectedOption = index; // 記錄使用者選取的選項
        noticeText = ""; // 清除未選答案提示
        return; // 完成選項點擊處理
      } // 結束選項點擊判斷
    } // 結束選項檢查迴圈
    if (pointInRect(mouseX, mouseY, layout.margin, layout.buttonY, layout.contentWidth, layout.buttonHeight)) { // 判斷是否點擊下一題按鈕
      if (selectedOption === -1) { // 判斷使用者是否尚未選答案
        noticeText = "請先選擇一個答案，再按下下一題。"; // 顯示未選答案提示
      } else { // 執行已選答案的提交分支
        submitted = true; // 鎖定目前題目避免再次修改
        userAnswers[currentQuestion] = selectedOption; // 儲存目前題目的答案
        if (selectedOption === questionData.answer) { // 判斷使用者答案是否正確
          score += 1; // 答對時增加分數
        } // 結束加分判斷
        noticeText = ""; // 清除未選答案提示
      } // 結束答案提交判斷
    } // 結束下一題按鈕判斷
  } else if (pointInRect(mouseX, mouseY, layout.margin, layout.buttonY, layout.contentWidth, layout.buttonHeight)) { // 判斷已提交後是否點擊下一題按鈕
    if (currentQuestion < questions.length - 1) { // 判斷是否還有下一題
      currentQuestion += 1; // 移動到下一題
      selectedOption = -1; // 清除下一題的選項選取
      submitted = false; // 解鎖下一題
      noticeText = ""; // 清除上一題提示
    } else { // 執行第五題完成分支
      finished = true; // 顯示測驗結果頁
    } // 結束下一題或完成測驗判斷
  } // 結束測驗頁點擊處理
} // 結束共用點擊處理函式

function mousePressed() { // 定義滑鼠按下事件函式
  handlePointerPress(); // 使用共用函式處理滑鼠操作
} // 結束滑鼠按下事件函式

function touchStarted() { // 定義觸控開始事件函式
  handlePointerPress(); // 使用共用函式處理觸控操作
  return false; // 阻止瀏覽器預設觸控行為
} // 結束觸控開始事件函式

function resetQuiz() { // 定義重新測驗函式
  currentQuestion = 0; // 將題目索引重設為第一題
  selectedOption = -1; // 清除選項選取狀態
  submitted = false; // 清除提交狀態
  finished = false; // 清除完成狀態
  score = 0; // 將分數重設為零
  userAnswers = []; // 清空使用者答案
  noticeText = ""; // 清除所有提示文字
} // 結束重新測驗函式
