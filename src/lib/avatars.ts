import a01 from "@/assets/avatars/avatar-01.jpg";
import a02 from "@/assets/avatars/avatar-02.jpg";
import a03 from "@/assets/avatars/avatar-03.jpg";
import a04 from "@/assets/avatars/avatar-04.jpg";
import a05 from "@/assets/avatars/avatar-05.jpg";
import a06 from "@/assets/avatars/avatar-06.jpg";
import a07 from "@/assets/avatars/avatar-07.jpg";
import a08 from "@/assets/avatars/avatar-08.jpg";
import a09 from "@/assets/avatars/avatar-09.jpg";
import a10 from "@/assets/avatars/avatar-10.jpg";
import a11 from "@/assets/avatars/avatar-11.jpg";
import a12 from "@/assets/avatars/avatar-12.jpg";
import a13 from "@/assets/avatars/avatar-13.jpg";
import a14 from "@/assets/avatars/avatar-14.jpg";
import a15 from "@/assets/avatars/avatar-15.jpg";
import a16 from "@/assets/avatars/avatar-16.jpg";
import a17 from "@/assets/avatars/avatar-17.jpg";
import a18 from "@/assets/avatars/avatar-18.jpg";
import a19 from "@/assets/avatars/avatar-19.jpg";
import a20 from "@/assets/avatars/avatar-20.jpg";

/** The only avatars a child can pick. No uploads, no external links. */
export const AVATARS = [
  { id: 1, name: "Renard", src: a01 },
  { id: 2, name: "Panda", src: a02 },
  { id: 3, name: "Chat", src: a03 },
  { id: 4, name: "Chiot", src: a04 },
  { id: 5, name: "Lapin", src: a05 },
  { id: 6, name: "Hibou", src: a06 },
  { id: 7, name: "Grenouille", src: a07 },
  { id: 8, name: "Lion", src: a08 },
  { id: 9, name: "Pingouin", src: a09 },
  { id: 10, name: "Koala", src: a10 },
  { id: 11, name: "Licorne", src: a11 },
  { id: 12, name: "Dinosaure", src: a12 },
  { id: 13, name: "Pieuvre", src: a13 },
  { id: 14, name: "Ourson", src: a14 },
  { id: 15, name: "Singe", src: a15 },
  { id: 16, name: "Hérisson", src: a16 },
  { id: 17, name: "Baleine", src: a17 },
  { id: 18, name: "Tigre", src: a18 },
  { id: 19, name: "Robot", src: a19 },
  { id: 20, name: "Dragon", src: a20 },
] as const;

export function avatarSrc(id: number | null | undefined) {
  return (AVATARS.find((a) => a.id === id) ?? AVATARS[0]).src;
}
export function avatarName(id: number | null | undefined) {
  return (AVATARS.find((a) => a.id === id) ?? AVATARS[0]).name;
}
