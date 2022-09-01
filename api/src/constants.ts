export type Files = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Ranks = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type LegitSquare = `${Files}${Ranks}`;

const SQUARES: LegitSquare[] = [
  "a8",
  "b8",
  "c8",
  "d8",
  "e8",
  "f8",
  "g8",
  "h8",
  "a7",
  "b7",
  "c7",
  "d7",
  "e7",
  "f7",
  "g7",
  "h7",
  "a6",
  "b6",
  "c6",
  "d6",
  "e6",
  "f6",
  "g6",
  "h6",
  "a5",
  "b5",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "h5",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "h4",
  "a3",
  "b3",
  "c3",
  "d3",
  "e3",
  "f3",
  "g3",
  "h3",
  "a2",
  "b2",
  "c2",
  "d2",
  "e2",
  "f2",
  "g2",
  "h2",
  "a1",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "h1",
];

/**
 * _
 *
 * also return undefined when out of range but im tired of typescript naive-ness
 * @param n number
 * @returns LegitSquare | undefined
 */
export const _ = (n: number): LegitSquare => SQUARES[n];
export const $ = (n: LegitSquare) => SQUARES.indexOf(n);
