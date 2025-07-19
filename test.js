QUnit.test('Implement the newGame() function', function(assert) {
    // Set playerTurn to false. newGame() is supposed to set it back to true.
    playerTurn = false;
 
    // Setup the game board after a game
    const buttons = getGameBoardButtons();
     for (let i = 0; i < buttons.length; i++) {      
         buttons[i].textContent = i % 2 === 0 ? "X" : "O";
         buttons[i].className = i % 2 === 0 ? "x" : "o";
         buttons[i].disabled = true;
     }
 
    // Ensure that a new game is started
    newGame();
 
    // Verify that the textContent of each is set to ""
    const count = Array.from(buttons).filter(btn => btn.textContent === "").length;
    // All 9 cells are expected to have "" as the textContent
    assert.equal(count, 9, 'Number of buttons with empty text content after calling newGame()');
 
    const disabledCount = Array.from(buttons).filter((btn) => btn.disabled === false).length;
    assert.equal(disabledCount, 9, 'Number of buttons with disabled property set to false');
 
    // The newGame() function is also required to set playerTurn to true
    assert.equal(playerTurn, true, "playerTurn is set to true ");
 
    // Turn info div's text content should be set to "Your turn"
    const actual = document.getElementById("turnInfo").textContent;
    assert.equal(actual, "Your turn", "turnInfo div text content");
 
    // computerMoveTimeout must be 0, although this doesn't guarantee that the timeout has 
    // actually been cleared
    assert.equal(computerMoveTimeout, 0, "computeMoveTimeout after calling newGame()");
 });

 QUnit.test('Implement the boardButtonClicked() function', function(assert) {
    // Ensure that a new game is started
    newGame();
 
    // Get all game board cells
    const buttons = getGameBoardButtons();
 
    // Call cellClicked on a random cell
    let index = Math.floor(Math.random() * 8);
    let button = buttons[index];
    boardButtonClicked(button);
 
    // boardButtonClicked calls switchTurn, which sets a timeout for makeComputeMove. This timeout 
    // must be cleared, or else the test can get messed up
    clearTimeout(computerMoveTimeout);
    computerMoveTimeout = 0;
 
    // That should have synchronously placed an "X" in the cell
    assert.equal(button.textContent, "X", "Clicked button's text content");
 
    // The cell's style color should also be "rgb(255, 0, 0)"
    //var cellStyle = window.getComputedStyle(cell);
    assert.equal(button.className, "x", "Clicked button's class is x");
 
    // The requirement to call switchTurn is trickier, since switchTurn() and makeComputerMove() 
    // must be implemented correctly for switchTurn to do anything. Therefore, this unit test 
    // doesn't verify that switchTurn is called.
 
    // Also verify button is disabled
    // Ensure that the "O" was not overwritten with an "X"
    assert.equal(button.disabled, true,
      `Clicked button's disabled attribute is true`);
 
     // "Cleanup" after test case by calling newGame()
     newGame();
 });

 QUnit.test('Implement switchTurn() part 1: turn-switching logic', function(assert) {

    let makeCompMoveCalled = false;
 
    // Mock makeComputerMove() so student doesn't have to provide correct implementation
    let savedFunc = makeComputerMove;
    makeComputerMove = function() {
      makeCompMoveCalled = true;
    }
 
    // Ensure that a new game is started
    newGame();
 
    assert.strictEqual(playerTurn, true, "playerTurn value before calling switchTurn()");
 
    // Call switchTurn() to switch to computer's turn
    switchTurn();
 
    // Assert synchronous stuff first
    assert.strictEqual(playerTurn, false, "playerTurn value after calling switchTurn()");
    const turnDiv = document.getElementById("turnInfo");
    assert.equal(turnDiv.textContent, "Computer's turn",
         "turnInfo div's text after calling switchTurn()");
 
    // Solution should NOT call makeComputerMove() synchronously (immediately)
    assert.equal(!makeCompMoveCalled, true, 
       "makeComputerMove() NOT immediately called after calling switchTurn()");
 
    // Get an async callback function from the test framework
    let done = assert.async();
 
    // The computer is supposed to go after 1 second, so setting a timeout for 2 seconds before 
    // verifying should suffice
    setTimeout(function() {
       assert.ok(makeCompMoveCalled, "makeComputerMove() called after 1 second");
       done();
 
       // Restore func
       makeComputerMove = savedFunc;
 
       // Call newGame at the end of the test
       newGame();
     }, 2000);
 });

 QUnit.test('Implement switchTurn() part 2: checking for a winner', function(assert) {
    // Each test case contains board contents and the expected message in the turn info div
    const testCases = [
         {
             // Top row win for computer
             "board": ["O", "O", "O",
                       "X", "O", "X",
                       "X", "X", ""],
             "expected": "Computer wins!"
         },
 
         {
             // Board filled with no winner - draw game
             "board": ["X", "X", "O",
                       "O", "X", "X",
                       "X", "O", "O"],
             "expected": "Draw game"
         },
 
         {
             // Top-left to bottom-right diagonal win for player
             "board": ["X", "", "",
                       "", "X", "",
                       "O", "O", "X"],
             "expected": "You win!"
         },
 
         {
             // Middle column win for computer
             "board": ["X", "O", "X",
                       "", "O", "X",
                       "", "O", ""],
             "expected": "Computer wins!"
         },
 
         {
             // Bottom row win for player
             "board": ["O", "X", "O",
                       "X", "O", "O",
                       "X", "X", "X"],
             "expected": "You win!"
         },
    ];
 
    // Test each case
    for (let testCase of testCases) {
       // Start a new game to clear out everything from any previous test
       newGame();
 
       // Populate board (minus coloring, which shouldn't matter)
       let buttons = getGameBoardButtons();
       buttons.forEach((button, i) => {
          button.textContent = testCase.board[i];
       });
 
       // Call switchTurn(), which should detect an end-game scenario and put appropriate 
       // text in the turn info div
       switchTurn();
 
       // Verify
       const actual = document.getElementById("turnInfo").textContent;
       assert.equal(actual, testCase.expected, "turnInfo's text shows winner");
 
       // Specification says playerTurn must be set to false
       assert.equal(playerTurn, false, "playerTurn value after end of game");
     }
 
    // "Cleanup" after test case by calling newGame()
    newGame();
 });

 QUnit.test('Implement makeComputerMove()', function(assert) {
    let index = -1;
 
    // Mock switchTurn() so we can verify makeComputerMove() calls it
    let funcCalled = false;
    let savedFunc = switchTurn;
    switchTurn = function() {
       funcCalled = true;
    }
 
    // Ensure that a new game is started
    newGame();
 
    // Get all game board cells
    const buttons = getGameBoardButtons();
 
    // Initialize an array of cell indices
    var indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    // Shuffle
    indices.forEach(i => {
       let index1 = Math.floor(Math.random() * 8);
       let index2 = Math.floor(Math.random() * 8);
       let temp = indices[index1];
       indices[index1] = indices[index2];
       indices[index2] = temp;
    });
 
    // Pop 3 indices, which will be "random" because of the shuffling, and put X's 
    // in those cells by setting innerHTML and style directly.
    const poppedX = [indices.pop(), indices.pop(), indices.pop()];
    for (index of poppedX) {
       buttons[index].textContent = "X";
       buttons[index].className = "x";
       buttons[index].disabled = true; // added Apr. 5, 2021
    }
 
    // Since 3 cells have X's, 2 need an O, then makeComputerMove can be called
    const poppedO = [indices.pop(), indices.pop()];
    for (index of poppedO) {
       buttons[index].textContent = "O";
       buttons[index].className = "o";
       buttons[index].disabled = true; // added Apr. 5, 2021
    }
 
    // Set playerTurn to false
    playerTurn = false;
 
    // Call makeComputerMove to synchronously place an "O" in an available spot
    makeComputerMove();
 
    // Find the location where new O was placed
    let newOindex = -1;
    for (let i = 0; i < buttons.length; i++) {
       if (buttons[i].textContent === "O" && !poppedO.includes(i)) {
          newOindex = i;
       }
    }
 
    // Verify the following:
    // 1. All original X's are still present
    // 2. All original O's are still present
    // 3. 1 additional O has been added
    // 4. The other 3 cells are blank
    // 5. Ensure class is correct and button is disabled
    // 6. Ensure switchTurn() is called
 
    // 1. All original X's are still present
    for (let index of poppedX) {
         assert.equal(buttons[index].textContent, "X",
             `Button that contained an "X" before calling makeComputerMove() still ` +
             `has content "X"`);
    }
 
    // 2. All original O's are still present
    for (let index of poppedO) {
       assert.equal(buttons[index].textContent, "O",
             `Button that contained an "O" before calling makeComputerMove() still ` +
             `has content "O"`);
     }
 
    // 3. 1 additional O has been added
    let oCount = 0;
    buttons.forEach((button, i) => {
       if (button.innerHTML === "O")
          oCount++;
    });
    assert.equal(oCount, poppedO.length + 1,
         `Number of buttons with "O" after calling makeComputerMove()`);
 
    // 4. The other 3 buttons are blank
    let blankCount = 0;
    buttons.forEach((button, i) => {
       if (button.innerHTML === "")
         blankCount++;
    });
    assert.equal(blankCount, 3, "Number of blank buttons after calling makeComputerMove()");
 
    assert.equal(buttons[newOindex].className, "o", "O button's class name");
 
    assert.ok(buttons[newOindex].disabled, "O button's disabled property");
 
    assert.ok(funcCalled, "makeComputerMove() calls switchTurn()");
 
    // Restore func
    switchTurn = savedFunc;
 
    // Call newGame once more to clear the timeout
    newGame();
 });

