# Why Is This A Checkmate?

![GitHub](https://img.shields.io/github/license/rootenginear/why-is-this-a-checkmate)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/rootenginear/why-is-this-a-checkmate/Glitch%20Sync)

A public API that can be used to explain why the entered chess position is a
checkmate.

## Endpoints

> Currently deployed at <https://whymate.glitch.me/>

```http
GET /
```

The root endpoint will response with the homepage that you can enter FEN to
perform mate checking.

---

```http
GET /<FEN>
```

Redirect to `GET /?fen=<FEN>`. You may replace any spaces in FEN string with `+` for
this syntax to work.

Examples:

- `/1R4k1/5ppp/8/8/8/8/5PPP/6K1`
- `/5bk1/2p2p1p/6p1/nB2pb2/1K6/2P2N2/1P1N1PPP/r3R3+w`

---

```http
GET /?fen=<FEN>[&flip][&img]
````

Generate a page that shows why in that position (FEN) is a checkmate. This
*required* the first part of the FEN — which is the board configuration.

However, you can also specify the second part of the FEN too, which will help
the checker to only find mate in that color. This part can be either "w" or
"b". If it's "w", the checker will check if white is in a mate, and vise versa.
If the mate is not found, *currently*, it will just render the position for you.

Parameters:

- `flip` : Show the board from the opposite *perspective*. Normally, if white is mating black, it will show as white perspective (A file at the left, H file at the right). But if black is mating white, it will show as black perspective (H file at the left, A file at the right).
- `img` : Generate an SVG image instead of a HTML page.

Examples:

- `/?fen=5bk1/2p2p1p/6p1/nB2pb2/1K6/2P2N2/1P1N1PPP/r3R3+w`
- `/?fen=kr6/ppN5/8/1K6/8/8/8/8+b&flip`
- `/?fen=5k2/5Q2/5K2/8/8/8/8/8+b&img`

## Todo

- [ ] If it's not a checkmate, show how to escape.
  - [ ] Show escape square.
  - [ ] Show if the check can be blocked.

## Resources

- Chess Pieces: Maestro chess piece by sadsnake1
- Board Theme: Green Plastic theme by the [lila authors](https://github.com/lichess-org/lila) and [pirouetti](https://lichess.org/@/pirouetti)

> Reference: <https://github.com/lichess-org/lila/blob/master/COPYING.md>
