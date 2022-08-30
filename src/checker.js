import { _, $ } from "./constants.js";

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
    _metadata: { K: null, k: null },
    get at() {
      return (n) => this[_(n)];
    },
  };
  for (const square_index in ranks) {
    const piece = ranks[square_index];
    if (piece === "-") continue;
    board[_(square_index)] = ranks[square_index];
    if (piece === "k") board._metadata.k = _(square_index);
    else if (piece === "K") board._metadata.K = _(square_index);
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
  board_string = board_string.replace(/\n$/, "");
  console.log(board_string);
  return board_string;
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
  const king_square = boardData._metadata[white ? "K" : "k"];
  const square_index = $(king_square);
  const prohibited_file = king_square.includes("a")
    ? "h"
    : king_square.includes("h")
    ? "a"
    : "x";
  return [
    square_index,
    square_index - 8 - 1,
    square_index - 8,
    square_index - 8 + 1,
    square_index - 1,
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

const calcSquareTilLeftRight = (square_name) => {
  const [file] = square_name;
  const til_left = file.charCodeAt(0) - 97;
  const til_right = 7 - til_left;
  return [til_left, til_right];
};

const whatIsCheckingThisSquare =
  (boardData, white = true) =>
  (square_name) => {
    const k = white ? "K" : "k";
    const is_king_at_board_edge = isAtBoardEdge(square_name);
    const [sq_til_left, sq_til_right] = calcSquareTilLeftRight(square_name);
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
    // 3. Check "strong" king
    checking_piece = white ? "k" : "K";
    if (boardData.at(si - 8) === checking_piece) return _(si - 8);
    if (boardData.at(si + 8) === checking_piece) return _(si + 8);
    if (is_king_at_board_edge !== "left") {
      if (boardData.at(si - 8 - 1) === checking_piece) return _(si - 8 - 1);
      if (boardData.at(si - 1) === checking_piece) return _(si - 1);
      if (boardData.at(si + 8 - 1) === checking_piece) return _(si + 8 - 1);
    }
    if (is_king_at_board_edge !== "right") {
      if (boardData.at(si - 8 + 1) === checking_piece) return _(si - 8 + 1);
      if (boardData.at(si + 1) === checking_piece) return _(si + 1);
      if (boardData.at(si + 8 + 1) === checking_piece) return _(si + 8 + 1);
    }
    // 4. Check sniper bishop
    checking_piece = white ? /[bq]/ : /[BQ]/;
    let walkTop = 1,
      walkLeft = 1,
      walkRight = 1,
      walkBottom = 1;
    let temp_si, temp_si2;
    while (walkTop + walkLeft + walkRight !== 0) {
      if (walkTop) {
        temp_si = si - walkTop++ * 8;
        if (temp_si < 0 || walkLeft + walkRight === 0) {
          walkTop = walkLeft = walkRight = 0;
        } else {
          if (walkLeft) {
            if (walkLeft > sq_til_left) walkLeft = 0;
            else {
              temp_si2 = temp_si - walkLeft;
              if (checking_piece.test(boardData.at(temp_si2))) return _(temp_si2);
              else if (
                boardData.at(temp_si2) === undefined ||
                boardData.at(temp_si2) === k
              )
                walkLeft++;
              else walkLeft = 0;
            }
          }
          if (walkRight) {
            if (walkRight > sq_til_right) walkRight = 0;
            else {
              temp_si2 = temp_si + walkRight;
              if (checking_piece.test(boardData.at(temp_si2))) return _(temp_si2);
              else if (
                boardData.at(temp_si2) === undefined ||
                boardData.at(temp_si2) === k
              )
                walkRight++;
              else walkRight = 0;
            }
          }
        }
      }
    }
    walkLeft = walkRight = 1;
    while (walkBottom + walkLeft + walkRight !== 0) {
      if (walkBottom) {
        temp_si = si + walkBottom++ * 8;
        if (temp_si > 63 || walkLeft + walkRight === 0) {
          walkBottom = walkLeft = walkRight = 0;
        } else {
          if (walkLeft) {
            if (walkLeft > sq_til_left) walkLeft = 0;
            else {
              temp_si2 = temp_si - walkLeft;
              if (checking_piece.test(boardData.at(temp_si2))) return _(temp_si2);
              else if (
                boardData.at(temp_si2) === undefined ||
                boardData.at(temp_si2) === k
              )
                walkLeft++;
              else walkLeft = 0;
            }
          }
          if (walkRight) {
            if (walkRight > sq_til_right) walkRight = 0;
            else {
              temp_si2 = temp_si + walkRight;
              if (checking_piece.test(boardData.at(temp_si2))) return _(temp_si2);
              else if (
                boardData.at(temp_si2) === undefined ||
                boardData.at(temp_si2) === k
              )
                walkRight++;
              else walkRight = 0;
            }
          }
        }
      }
    }
    // 5. Check rook
    checking_piece = white ? /[rq]/ : /[RQ]/;
    walkTop = walkLeft = walkRight = walkBottom = 1;
    while (walkTop + walkLeft + walkRight + walkBottom !== 0) {
      if (walkTop) {
        temp_si = si - walkTop * 8;
        if (temp_si < 0) walkTop = 0;
        else {
          if (checking_piece.test(boardData.at(temp_si))) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkTop++;
          else walkTop = 0;
        }
      }
      if (walkLeft) {
        if (walkLeft > sq_til_left) walkLeft = 0;
        else {
          temp_si = si - walkLeft;
          if (checking_piece.test(boardData.at(temp_si))) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkLeft++;
          else walkLeft = 0;
        }
      }
      if (walkRight) {
        if (walkRight > sq_til_right) walkRight = 0;
        else {
          temp_si = si + walkRight;
          if (checking_piece.test(boardData.at(temp_si))) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkRight++;
          else walkRight = 0;
        }
      }
      if (walkBottom) {
        temp_si = si + walkBottom * 8;
        if (temp_si > 63) walkBottom = 0;
        else {
          if (checking_piece.test(boardData.at(temp_si))) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkBottom++;
          else walkBottom = 0;
        }
      }
    }
  };

// const MATES = [
//   {
//     name: "start-pos",
//     fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
//     mateWhiteKing: false,
//   },
//   { name: "ladder-mate", fen: "1R2k3/R7/8/8/8/8/4K3/8 b - - 0 1", mateWhiteKing: false },
//   {
//     name: "backrank-mate",
//     fen: "k1R5/pp6/8/8/4K3/8/8/8 b - - 0 1",
//     mateWhiteKing: false,
//   },
//   {
//     name: "sniper-mate",
//     fen: "1kr5/QppKP3/8/8/8/4B3/8/8 b - - 0 1",
//     mateWhiteKing: false,
//   },
//   { name: "rookq-mate", fen: "5k2/1R3Q2/8/8/8/8/8/7K b - - 0 1", mateWhiteKing: false },
//   { name: "rook-mate", fen: "1k1R4/8/1K6/8/8/8/8/8 b - - 0 1", mateWhiteKing: false },
//   {
//     name: "smothered-mate",
//     fen: "kr6/ppN5/8/1K6/8/8/8/8 b - - 0 1",
//     mateWhiteKing: false,
//   },
// ];

export const whyIsItAMate = (fen, mateWhiteKing = false) => {
  // console.log(fen);

  const parsed_fen = transpileFen(fen);
  // console.log(parsed_fen);

  // renderBoard(parsed_fen);

  const squares_for_check = getPossibleSquareAtKing(parsed_fen, mateWhiteKing);
  const what_attack_these_squares = squares_for_check.map(
    whatIsCheckingThisSquare(parsed_fen, mateWhiteKing)
  );

  return [squares_for_check, what_attack_these_squares, parsed_fen];

  // const color_str = mateWhiteKing ? "White" : "Black";
  // if (!what_attack_these_squares.includes(undefined)) {
  //   console.log(`This is a checkmate for ${color_str.toLocaleLowerCase()} king because:`);
  //   for (const i in squares_for_check) {
  //     console.log(
  //       `— ${parsed_fen[what_attack_these_squares[i]].toLocaleUpperCase()}${
  //         what_attack_these_squares[i]
  //       } is attacking ${squares_for_check[i]}.`
  //     );
  //   }
  //   console.log(`${color_str} king has nowhere to run.`);
  // } else {
  //   console.log("This is not a checkmate:");
  //   for (const i in squares_for_check) {
  //     if (!what_attack_these_squares[i]) {
  //       console.log(`— ${squares_for_check[i].toLocaleUpperCase()} has no attacker.`);
  //     }
  //   }
  //   console.log(`${color_str} king is safe.`);
  // }
  // console.log("--------------------------------------------------");
};

// MATES.forEach(({ fen, mateWhiteKing }) => whyIsItAMate(fen, mateWhiteKing));
