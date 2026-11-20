// Woorden per letter. pic = ingebouwd plaatje (emoji-illustratie) of "svg:<naam>" voor een eigen
// tekening uit art.js. In de Ouderhoek kun je per woord de tekst aanpassen en een eigen foto kiezen.
// Volgorde = audio-id's <letter>_woord_1..3 in het inspreekscript.
export const WORDS = {
  a: [["appel", "🍎"], ["aap", "🐒"], ["auto", "🚗"]],
  b: [["bal", "⚽"], ["beer", "🐻"], ["boom", "🌳"]],
  c: [["clown", "🤡"], ["cactus", "🌵"], ["citroen", "🍋"]],
  d: [["dolfijn", "🐬"], ["deur", "🚪"], ["draak", "🐉"]],
  e: [["eend", "🦆"], ["egel", "🦔"], ["emmer", "🪣"]],
  f: [["fiets", "🚲"], ["fles", "svg:fles"], ["flamingo", "🦩"]],
  g: [["geit", "🐐"], ["gitaar", "🎸"], ["gieter", "svg:gieter"]],
  h: [["hond", "🐶"], ["huis", "🏠"], ["hart", "💖"]],
  i: [["inktvis", "🐙"], ["iglo", "svg:iglo"], ["insect", "🐞"]],
  j: [["jas", "🧥"], ["juf", "👩‍🏫"], ["jurk", "👗"]],
  k: [["kat", "🐱"], ["kip", "🐔"], ["kasteel", "🏰"]],
  l: [["leeuw", "🦁"], ["lamp", "svg:lamp"], ["luchtballon", "svg:luchtballon"]],
  m: [["maan", "🌙"], ["muis", "🐭"], ["melk", "🥛"]],
  n: [["neus", "👃"], ["nest", "🪺"], ["noot", "🌰"]],
  o: [["olifant", "🐘"], ["oog", "👁️"], ["oma", "👵"]],
  p: [["poes", "🐈"], ["paard", "🐴"], ["peer", "🍐"]],
  q: [["quiz", "❓"], ["quad", "svg:quad"], ["quiche", "🥧"]],
  r: [["roos", "🌹"], ["raket", "🚀"], ["regenboog", "🌈"]],
  s: [["slang", "🐍"], ["ster", "⭐"], ["sok", "🧦"]],
  t: [["trein", "🚂"], ["taart", "🎂"], ["tijger", "🐯"]],
  u: [["uil", "🦉"], ["ui", "🧅"], ["uniform", "👮‍♀️"]],
  v: [["vis", "🐟"], ["vlinder", "🦋"], ["vogel", "🐦"]],
  w: [["wolk", "☁️"], ["water", "💧"], ["walvis", "🐳"]],
  x: [["xylofoon", "svg:xylofoon"], ["taxi", "🚕"], ["saxofoon", "🎷"]],
  y: [["yoga", "🧘‍♀️"], ["yoghurt", "🥣"], ["yeti", "svg:yeti"]],
  z: [["zebra", "🦓"], ["zon", "☀️"], ["zee", "🌊"]],
};

// Letters waarvan de klank in woorden verschilt (de app laat dit horen en zien).
export const SOUND_NOTE = {
  c: "De c klinkt als k (clown) of als s (citroen).",
  q: "De q staat bijna altijd samen met de u.",
  x: "De x klinkt als ks. Hij zit vaak ín het woord.",
  y: "De y klinkt hier als j.",
};
