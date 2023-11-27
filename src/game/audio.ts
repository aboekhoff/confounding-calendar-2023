import { Howl } from "howler";

export const SoundType = {
  STEP: "STEP",
  PULSE: "PULSE",
  BOX: "BOX",
  SPARKLE: "SPARKLE",
}

const soundData: Record<string, { prefix: string, number: number }> = {
  [SoundType.STEP]: { prefix: "step", number: 4 },
  [SoundType.PULSE]: { prefix: "pulse", number: 1 },
  [SoundType.BOX]: { prefix: "box", number: 1 },
  [SoundType.SPARKLE]: { prefix: "sparkle", number: 1 },
};

export class Audio {
  static initialized = false;
  static sounds: Map<string, Howl[]> = new Map();

  public static init () {
    this.initialized = true;
    Object.keys(soundData).forEach(key => {
      const data = soundData[key];
      const arr: Howl[] = [];
      this.sounds.set(key, arr);
      for (let i = 0; i < data.number; i++) {
        const src = data.prefix + (i+1) + ".wav";
        arr.push(new Howl({
          src: src,
        }));
      }
    });
  }

  public static play (sound: string) {
    if (!this.initialized) {
      this.init();
    }
    console.log("playing fucking sound: " + sound);
    const options = this.sounds.get(sound)!;
    const idx = Math.floor(Math.random() * options.length);
    options[idx].play();
  }
}