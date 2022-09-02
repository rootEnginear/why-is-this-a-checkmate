import { _, $ } from "./constants";
import type { LegitSquare } from "./constants";

export type BlackPieces = "p" | "r" | "n" | "b" | "q" | "k";
export type WhitePieces = Uppercase<BlackPieces>;
export type Pieces = BlackPieces | WhitePieces;

export type BoardLocation = Partial<Record<LegitSquare, Pieces>>;
export type BoardData = BoardLocation & {
  _metadata: {
    K: LegitSquare;
    k: LegitSquare;
    fen: string;
    pieces: Pieces[];
    side: string;
  };
  readonly at: (n: number) => Pieces | undefined;
};
export type LooseBoardData = Omit<BoardData, "_metadata"> & {
  _metadata: {
    K: LegitSquare | undefined;
    k: LegitSquare | undefined;
    fen: string;
    pieces: Pieces[];
    side: string;
  };
};

const isWhite = (piece: Pieces) => /[A-Z]/.test(piece);

const isOccupiedBySamePieceColor = (piece: Pieces | undefined, whitePiece = true) => {
  if (!piece) return false;
  return isWhite(piece) === whitePiece;
};

const isAtBoardEdge = (square: LegitSquare) =>
  square.includes("a") ? "left" : square.includes("h") ? "right" : false;

/**
 * transpileFen
 * --------------------------------------------------
 * Transpile FEN into BoardData
 *
 * @param {string} fen
 * @returns BoardData
 */
const transpileFen = (fen: string) => {
  const [raw_ranks, side] = fen.split(" ");
  const ranks = raw_ranks.replace(/\d/g, (e) => "-".repeat(+e)).replace(/\//g, "");
  if (ranks.length !== 64)
    throw new Error(`FEN is not valid. Expect 64 squares but found ${ranks.length}`);

  const board: LooseBoardData = {
    _metadata: { K: undefined, k: undefined, fen, pieces: [] as Pieces[], side },
    get at() {
      return (n: number) => this[_(n)];
    },
  };
  for (let i = 0; i < 64; i++) {
    const piece = ranks[i] as Pieces | "-";
    if (piece === "-") continue;
    board[_(i) ?? "a1"] = ranks[i] as Pieces;
    if (!board._metadata.pieces.includes(piece)) {
      board._metadata.pieces.push(piece);
      if (piece === "k") board._metadata.k = _(i);
      else if (piece === "K") board._metadata.K = _(i);
    }
  }
  if (!board._metadata.K) throw new Error("White king not found!");
  if (!board._metadata.k) throw new Error("Black king not found!");
  return board as BoardData;
};

/**
 * renderBoard
 * --------------------------------------------------
 * Render Board in console.
 *
 * @param {BoardData} boardData
 * @returns string
 */
export const renderBoard = (boardData: BoardData) => {
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
 * getKingSquares
 * --------------------------------------------------
 * Get an empty OR a square that an enemy piece is placed on it INCLUDING the king.
 * This will be for to checkscan.
 *
 * @param {BoardData} boardData
 * @param {boolean} atWhiteKing
 * @returns LegitSquare[]
 */
const getKingSquares = (boardData: BoardData, atWhiteKing = true) => {
  const king_square = boardData._metadata[atWhiteKing ? "K" : "k"];
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
    .filter(
      (s): s is Exclude<typeof s, undefined> =>
        (s && !s.includes(prohibited_file)) || false
    )
    .filter(
      (s) =>
        /[kK]/.test(boardData[s] ?? "") ||
        !isOccupiedBySamePieceColor(boardData[s], atWhiteKing)
    );
};

const calcLeftRightSpace = (square_name: LegitSquare) => {
  const [file] = square_name;
  const til_left = file.charCodeAt(0) - 97;
  const til_right = 7 - til_left;
  return [til_left, til_right];
};

/**
 * checkScan
 * --------------------------------------------------
 * Scan for the attacker on a particular square.
 *
 * @param {BoardData} boardData
 * @param {boolean} [checkWhite]
 * @returns
 */
const checkScan =
  (boardData: BoardData, checkWhite = true) =>
  (square_name: LegitSquare) => {
    const k = checkWhite ? "K" : "k";
    const is_king_at_board_edge = isAtBoardEdge(square_name);
    const [sq_til_left, sq_til_right] = calcLeftRightSpace(square_name);
    const si = $(square_name);
    // 1. Check pawn
    let checking_piece: string | RegExp = checkWhite ? "p" : "P";
    if (checkWhite) {
      // check for black pawn
      if (is_king_at_board_edge !== "left" && boardData.at(si - 8 - 1) === checking_piece)
        return _(si - 8 - 1);
      if (
        is_king_at_board_edge !== "right" &&
        boardData.at(si - 8 + 1) === checking_piece
      )
        return _(si - 8 + 1);
    } else {
      // check for white pawn
      if (is_king_at_board_edge !== "left" && boardData.at(si + 8 - 1) === checking_piece)
        return _(si + 8 - 1);
      if (
        is_king_at_board_edge !== "right" &&
        boardData.at(si + 8 + 1) === checking_piece
      )
        return _(si + 8 + 1);
    }
    // 2. Check sneaky horsey
    checking_piece = checkWhite ? "n" : "N";
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
    checking_piece = checkWhite ? "k" : "K";
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
    checking_piece = checkWhite ? /[bq]/ : /[BQ]/;
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
              if (checking_piece.test(boardData.at(temp_si2) ?? "")) return _(temp_si2);
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
              if (checking_piece.test(boardData.at(temp_si2) ?? "")) return _(temp_si2);
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
              if (checking_piece.test(boardData.at(temp_si2) ?? "")) return _(temp_si2);
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
              if (checking_piece.test(boardData.at(temp_si2) ?? "")) return _(temp_si2);
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
    checking_piece = checkWhite ? /[rq]/ : /[RQ]/;
    walkTop = walkLeft = walkRight = walkBottom = 1;
    while (walkTop + walkLeft + walkRight + walkBottom !== 0) {
      if (walkTop) {
        temp_si = si - walkTop * 8;
        if (temp_si < 0) walkTop = 0;
        else {
          if (checking_piece.test(boardData.at(temp_si) ?? "")) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkTop++;
          else walkTop = 0;
        }
      }
      if (walkLeft) {
        if (walkLeft > sq_til_left) walkLeft = 0;
        else {
          temp_si = si - walkLeft;
          if (checking_piece.test(boardData.at(temp_si) ?? "")) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkLeft++;
          else walkLeft = 0;
        }
      }
      if (walkRight) {
        if (walkRight > sq_til_right) walkRight = 0;
        else {
          temp_si = si + walkRight;
          if (checking_piece.test(boardData.at(temp_si) ?? "")) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkRight++;
          else walkRight = 0;
        }
      }
      if (walkBottom) {
        temp_si = si + walkBottom * 8;
        if (temp_si > 63) walkBottom = 0;
        else {
          if (checking_piece.test(boardData.at(temp_si) ?? "")) return _(temp_si);
          else if (boardData.at(temp_si) === undefined || boardData.at(temp_si) === k)
            walkBottom++;
          else walkBottom = 0;
        }
      }
    }
    return;
  };

/**
 * findMate
 * --------------------------------------------------
 * Find mate in specified FEN
 *
 * @param {string} fen FEN to parsed and find mate
 * @returns [has_mate, squares_for_check, what_attack_these_squares, parsed_fen]
 */
export const findMate = (fen: string) => {
  const parsed_fen = transpileFen(fen);

  const mate_side = parsed_fen._metadata.side;

  if (["b", "w"].includes(mate_side)) {
    const mate_white_king = mate_side === "w";

    const squares_for_check = getKingSquares(parsed_fen, mate_white_king);
    const checChecker = checkScan(parsed_fen, mate_white_king);
    const what_attack_these_squares = squares_for_check.map(checChecker);

    const has_mate = !what_attack_these_squares.includes(undefined);

    return [has_mate, squares_for_check, what_attack_these_squares, parsed_fen];
  }
  // Check for both black and white, check if black mate white first
  parsed_fen._metadata.side = "w";
  let squares_for_check = getKingSquares(parsed_fen, true);
  let checChecker = checkScan(parsed_fen, true);
  let what_attack_these_squares = squares_for_check.map(checChecker);
  let has_mate = !what_attack_these_squares.includes(undefined);

  if (has_mate)
    return [has_mate, squares_for_check, what_attack_these_squares, parsed_fen];

  parsed_fen._metadata.side = "b";
  squares_for_check = getKingSquares(parsed_fen, false);
  checChecker = checkScan(parsed_fen, false);
  what_attack_these_squares = squares_for_check.map(checChecker);
  has_mate = !what_attack_these_squares.includes(undefined);

  return [has_mate, squares_for_check, what_attack_these_squares, parsed_fen];
};
