import React from "react";

const Header: React.FC = () => {
  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/brylle-justin-heraldo-5527802ba/",
      icon: "fab fa-linkedin",
    },
    {
      name: "GitHub",
      url: "https://github.com/TeruhashiN",
      icon: "fab fa-github",
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@justinteruh?lang=en",
      icon: "fab fa-tiktok",
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/BrylleJustin.Chi",
      icon: "fab fa-facebook",
    },
  ];

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Skills", href: "#skills" },
    { name: "Experience", href: "#experience" },
    { name: "Projects", href: "#projects" },
    { name: "Certifications", href: "#certifications" },
    { name: "Contact", href: "#footer" },
  ];

  return (
    <header className="text-black py-5 bg-gradient">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#about">
            Brylle Justin Heraldo
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {navLinks.map((link, index) => (
                <li key={index} className="nav-item">
                  <a className="nav-link" href={link.href}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mt-5">
        <div className="col-lg-10 mx-auto">
          <div className="header-border shadow-lg p-4 rounded">
            <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center text-center gap-4">
              <div>
                <h1 className="display-4 fw-bold">Brylle Justin Heraldo</h1>
                <p className="lead">Software Developer | Game Developer</p>
                <div className="d-flex justify-content-center gap-3 mb-3">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      className="text-black fs-4"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                    >
                      <i className={link.icon}></i>
                    </a>
                  ))}
                </div>
              </div>

              <img
                src="/images/profileDPs.jpg"
                alt="Profile"
                className="small-profile shadow"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
