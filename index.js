import { _, $ } from "./const.js";

const isWhite = (piece) => /[A-Z]/.test(piece);

const isOccupiedBySamePieceColor = (piece, white = true) => {
  if (!piece) return false;
  return isWhite(piece) === white;
};

const isAtBoardEdge = (square) =>
  square.includes("a") ? "left" : square.includes("h") ? "right" : false;

/**
 * transpileFen
 * @param {string} fen FEN, might be valid or invalid but must have 7 '/'
 * @returns {BoardData}
 */
const transpileFen = (fen) => {
  const ranks = fen
    .split(" ")[0]
    .replace(/\d/g, (e) => "-".repeat(+e))
    .replace(/\//g, "");
  if (ranks.length < 64)
    throw new Error(`FEN is not complete. Expect 64 squares but found ${ranks.length}`);

  const board = {
    _metadata: { wking_square: null, bking_square: null },
    get at() {
      return (n) => this[_(n)];
    },
  };
  for (const square_index in ranks) {
    const piece = ranks[square_index];
    if (piece === "-") continue;
    board[_(square_index)] = ranks[square_index];
    if (piece === "k") board._metadata.bking_square = _(square_index);
    if (piece === "K") board._metadata.wking_square = _(square_index);
  }
  return board;
};

/**
 * renderBoard
 * @param {BoardData} boardData
 */
const renderBoard = (boardData) => {
  let board_string = "";
  for (let i = 0; i < 64; ) {
    const data = boardData.at(i);
    if (data) board_string += data;
    else board_string += "-";
    if (!(++i % 8)) board_string += "\n";
  }
  console.log(board_string);
};

/**
 * getPossibleSquareAroundKing
 * --------------------------------------------------
 * Possible Square = empty OR has a enemy piece placed on it INCLUDES the king.
 * This will be for to checkscan.
 *
 * @param {BoardData} boardData
 * @param {boolean} white
 * @returns square around the king as an array
 */
const getPossibleSquareAtKing = (boardData, white = true) => {
  const king_square = boardData._metadata[white ? "wking_square" : "bking_square"];
  const square_index = $(king_square);
  const prohibited_file = king_square.includes("a")
    ? "h"
    : king_square.includes("h")
    ? "a"
    : "x";
  return [
    square_index - 8 - 1,
    square_index - 8,
    square_index - 8 + 1,
    square_index - 1,
    square_index,
    square_index + 1,
    square_index + 8 - 1,
    square_index + 8,
    square_index + 8 + 1,
  ]
    .map((s) => _(s))
    .filter((s) => s && !s.includes(prohibited_file))
    .filter(
      (s) => /[kK]/.test(boardData[s]) || !isOccupiedBySamePieceColor(boardData[s], white)
    );
};

const whatIsCheckingThisSquare =
  (boardData, white = true) =>
  (square_name) => {
    const is_king_at_board_edge = isAtBoardEdge(square_name);
    const si = $(square_name);
    // 1. Check pawn
    let checking_piece = white ? "p" : "P";
    if (white) {
      // check for black pawn
      if (is_king_at_board_edge !== "left" && boardData.at(si - 8 - 1) === checking_piece)
        return _(si - 8 - 1);
      if (
        is_king_at_board_edge !== "right" &&
        boardData.at(si - 8 + 1) === checking_piece
      )
        return _(si - 8 - 1);
    } else {
      // check for white pawn
      if (is_king_at_board_edge !== "left" && boardData.at(si + 8 - 1) === checking_piece)
        return _(si + 8 - 1);
      if (
        is_king_at_board_edge !== "right" &&
        boardData.at(si + 8 + 1) === checking_piece
      )
        return _(si + 8 - 1);
    }
    // 2. Check sneaky horsey
    checking_piece = white ? "n" : "N";
    if (is_king_at_board_edge !== "left") {
      if (boardData.at(si - 16 - 1) === checking_piece) return _(si - 16 - 1);
      if (boardData.at(si - 8 - 2) === checking_piece) return _(si - 8 - 2);
      if (boardData.at(si + 8 - 2) === checking_piece) return _(si + 8 - 2);
      if (boardData.at(si + 16 - 1) === checking_piece) return _(si + 16 - 1);
    }
    if (is_king_at_board_edge !== "right") {
      if (boardData.at(si - 16 + 1) === checking_piece) return _(si - 16 + 1);
      if (boardData.at(si - 8 + 2) === checking_piece) return _(si - 8 + 2);
      if (boardData.at(si + 8 + 2) === checking_piece) return _(si + 8 + 2);
      if (boardData.at(si + 16 + 1) === checking_piece) return _(si + 16 + 1);
    }
    // 3. Check sniper bishop
    // 4. Check rook
    // 5. Check queen
    // 6. Check "strong" king
  };

const START_POS_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const LADDER_MATE = "1R2k3/R7/8/8/8/8/4K3/8 b - - 0 1";
const BACKRANK_MATE = "k1R5/pp6/8/8/4K3/8/8/8 b - - 0 1";
const SNIPER_MATE = "1kr5/QppKP3/8/8/8/4B3/8/8 b - - 0 1";
const ROOK_MATE = "1k1R4/8/1K6/8/8/8/8/8 b - - 0 1";
const SMOTHERED_MATE = "kr6/ppN5/8/1K6/8/8/8/8 b - - 0 1";

const WHITE = false;

console.log(SMOTHERED_MATE);

const parsed_fen = transpileFen(SMOTHERED_MATE);
renderBoard(parsed_fen);

const squares_for_check = getPossibleSquareAtKing(parsed_fen, WHITE);
const what_attack_these_squares = squares_for_check.map(
  whatIsCheckingThisSquare(parsed_fen, WHITE)
);

if (!what_attack_these_squares.includes(undefined)) {
  const color_str = WHITE ? "White" : "Black";
  console.log(`This is a checkmate for ${color_str.toLocaleLowerCase()} king because:`);
  for (const i in squares_for_check) {
    console.log(
      `— ${parsed_fen[what_attack_these_squares[i]].toLocaleUpperCase()}${
        what_attack_these_squares[i]
      } is attacking ${squares_for_check[i]}`
    );
    console.log(`${color_str} king has nowhere to run`);
  }
}
