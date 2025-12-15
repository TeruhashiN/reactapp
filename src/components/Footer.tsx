import React from "react";

const Footer: React.FC = () => {
  const socialLinks = [
    { name: "LinkedIn", url: "#", text: "LinkedIn" },
    { name: "GitHub", url: "#", text: "GitHub" },
    { name: "Twitter", url: "#", text: "Twitter" },
    { name: "Email", url: "mailto:your.email@example.com", text: "Email" },
  ];

  const quickLinks = [
    { name: "About", href: "#about" },
    { name: "Experience", href: "#experience" },
    { name: "Projects", href: "#projects" },
    { name: "Certifications", href: "#certifications" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-dark text-white py-4 border-top border-secondary">
      <div className="container">
        <div className="row">
          {/* About Section */}
          <div className="col-lg-4 mb-4">
            <h6 className="fw-bold mb-3">Brylle Justin Heraldo</h6>
            <p className="text-light mb-3">
              Full Stack Developer passionate about creating innovative
              solutions and building amazing web experiences.
            </p>
            <div className="d-flex">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="text-white me-3 text-decoration-none fw-semibold"
                  title={link.name}
                  target={link.url.startsWith("http") ? "_blank" : "_self"}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : ""}
                  aria-label={`Visit ${link.name}`}
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-4 mb-4">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              {quickLinks.map((link, index) => (
                <li key={index} className="mb-2">
                  <a
                    href={link.href}
                    className="text-light text-decoration-none"
                    aria-label={`Go to ${link.name}`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-4 mb-4">
            <h6 className="fw-bold mb-3">Get In Touch</h6>
            <p className="text-light mb-3">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:your.bryllejheraldo@gmail.com"
                className="text-light text-decoration-none"
              >
                bryllejheraldo@gmail.com
              </a>
              <br />
              <strong>Phone:</strong> +63 9850703940 
              <br />
              <strong>Location:</strong> Camarines Norte, Philippines
            </p>
          </div>
        </div>

        {/* Back to Top and Copyright */}
        <hr className="my-4 border-secondary" />
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="mb-0">&copy; 2024 Your Name. All rights reserved.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <button
              onClick={scrollToTop}
              className="btn btn-outline-light btn-sm me-3"
              aria-label="Back to top"
            >
              Back to Top
            </button>
            <p className="mb-0 d-inline">
              Built with ❤️ using React & Bootstrap
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
