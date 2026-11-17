// Astrelle's timings, the same for everything that moves, so it all moves with one rhythm (and
// the same as styles/aether.css's --aether-quick, --aether-move, --aether-move-out, --aether-pause
// and --aether-spring-time):
//   quick: small fades, 160 ms;
//   move: things sliding in, 300 ms, gliding to a stop; out, a little quicker, 240 ms, after a
//     pause of 150 ms that forgives a mouse slipping off;
//   spring: things settling with a slight overshoot, 420 ms.
// Only moving and fading, which the graphics card does, never sizes (tests/animations-on-gpu).

export const QUICK = 160;
export const MOVE = 300;
export const MOVE_OUT = 240;
export const PAUSE = 150;
export const SPRING_TIME = 420;
export const GLIDE = "cubic-bezier(0.22, 1, 0.36, 1)"; // --aether-glide
export const EXIT = "cubic-bezier(0.55, 0, 1, 0.45)";
