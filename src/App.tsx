import "./App.css";
import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Certifications from "./components/Certifications";
import Footer from "./components/Footer";

function App() {
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

export default App;
