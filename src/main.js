import { Chessboard, MARKER_TYPE } from "./cm-chessboard/Chessboard.js";
import { ARROW_TYPE, Arrows } from "./cm-chessboard/extensions/arrows/Arrows.js";
import { whyIsItAMate } from "./checker.js";

const redMarker = { class: "marker-circle-red", slice: "markerCircle" };

const el_explain = document.getElementById("el-explain");

const chessboard = new Chessboard(document.getElementById("chessboard"), {
  position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
  sprite: {
    url: "chessboard-sprite.svg", // pieces and markers are stored in a sprite file
    cache: true, // cache the sprite
  },
  style: { aspectRatio: 1 },
  extensions: [
    {
      class: Arrows,
      props: {
        sprite: {
          url: "arrows.svg",
        },
      },
    },
  ],
});

const checkMate = () => {
  const fen = document.getElementById("inp-fen").value;
  const white = document.getElementById("inp-white").checked;

  chessboard.removeArrows();
  chessboard.removeMarkers();
  chessboard.setPosition(fen, true);

  const [square, attacker, parsed_fen] = whyIsItAMate(fen, white);

  if (attacker.includes(undefined)) {
    const free_space_index = attacker.indexOf(undefined);
    if (square[0] === square[free_space_index]) {
      chessboard.addMarker(MARKER_TYPE.circle, square[0]);
      el_explain.innerText = "You are safe.";
    } else {
      chessboard.addArrow(ARROW_TYPE.default, square[0], square[free_space_index]);
      chessboard.addMarker(MARKER_TYPE.circle, square[free_space_index]);
      el_explain.innerText = `You can move to/take on ${square[free_space_index]} because it's not protected.`;
    }
  } else {
    let text = "This is a checkmate because:";
    for (const i in square) {
      chessboard.addArrow(ARROW_TYPE.pointy, attacker[i], square[i]);
      chessboard.addMarker(redMarker, square[i]);
      text += `<br>&bull; ${parsed_fen[attacker[i]].toLocaleUpperCase()}${
        attacker[i]
      } is attacking/protecting ${square[i]}.`;
    }
    text += "<br>The king has nowhere to run :(";
    el_explain.innerHTML = text;
  }
};

const setMate = (fen) => {
  document.getElementById("inp-fen").value = fen;
  document.getElementById("inp-black").checked = true;
  checkMate();
};

window.checkMate = checkMate;
window.setMate = setMate;
