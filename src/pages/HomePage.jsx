import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { HomeEventPhotos } from "../components/EventPhotosCarousel";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";

//import Mosaic from "../components/Mosaic";
//import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <div className="container" >
        <Navbar />
        <Hero />
        <HomeEventPhotos />
        <Outlet />
        <Footer />
      </div>
      
    </>
  );
}