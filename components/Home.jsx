"use client";
import { useState } from "react";
import Intro from "./Intro";
import Reveals from "./Reveals";
import Backdrop from "./Backdrop";
import Hero from "./sections/Hero";
import Collection from "./sections/Collection";
import Ticker from "./sections/Ticker";
import DressingChapter from "./sections/DressingChapter";
import StylistChapter from "./sections/StylistChapter";
import Atelier from "./sections/Atelier";
import Moods from "./sections/Moods";
import ShopTheFilm from "./sections/ShopTheFilm";
import PickedForYou from "./sections/PickedForYou";
import Craft from "./sections/Craft";
import ShopEdit from "./sections/ShopEdit";
import ShopByCategory from "./sections/ShopByCategory";
import FitFinder from "./sections/FitFinder";
import CompleteTheLook from "./sections/CompleteTheLook";
import Services from "./sections/Services";
import { UGCWall, Newsletter, Footer } from "./sections/Closing";

export default function Home() {
  const [ready, setReady] = useState(false);
  return (
    <>
      <Backdrop />
      <Intro onDone={() => setReady(true)} />
      <main id="main">
        <Hero ready={ready} />
        <Ticker />
        <ShopByCategory />
        <Collection />
        <ShopEdit />
        <DressingChapter />
        <FitFinder />
        <StylistChapter />
        <CompleteTheLook />
        <Atelier />
        <Moods />
        <ShopTheFilm />
        <PickedForYou />
        <Craft />
        <UGCWall />
        <Services />
        <Newsletter />
      </main>
      <Footer />
      <Reveals />
    </>
  );
}
