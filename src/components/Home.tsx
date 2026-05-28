import Header from "./Header";
import About from "./About";
import Skills from "./skills";
import Experience from "./Experience";
import Projects from "./Projects";
import Certifications from "./Certifications";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="App">
      <Header />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Certifications />
      <Footer />
    </div>
  );
}
