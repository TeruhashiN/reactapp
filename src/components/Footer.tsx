import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/brylle-justin-heraldo-5527802ba/",
      text: "LinkedIn",
    },
    { name: "GitHub", url: "https://github.com/TeruhashiN", text: "GitHub" },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@justinteruh?lang=en",
      text: "TikTok",
    },
    {
      name: "测验部分",
      url: "/quiz",
      text: "测验部分",
    },
  ];

  const quickLinks = [
    { name: "About", href: "#about" },
    { name: "Experience", href: "#experience" },
    { name: "Projects", href: "#projects" },
    { name: "Certifications", href: "#certifications" },
  ];

  return (
    <footer id="footer" className="bg-white text-black py-4">
      <div className="container border-top border-dark pt-4">
        <div className="row">
          {/* About Section */}
          <div className="col-lg-4 mb-4">
            <h6 className="fw-bold mb-3">Brylle Justin Heraldo</h6>
            <p className="text-black mb-3">
              Software Developer experienced in web, mobile, game development,
              and 3D design, dedicated to delivering innovative and high-quality
              solutions.
            </p>
            <div className="d-flex">
              {socialLinks.map((link, index) => {
                const isInternalQuizRoute = link.url.startsWith("/");

                if (isInternalQuizRoute) {
                  return (
                    <Link
                      key={index}
                      to={link.url}
                      className="text-black me-3 text-decoration-none fw-semibold"
                      aria-label={`Go to ${link.name}`}
                    >
                      {link.text}
                    </Link>
                  );
                }

                return (
                  <a
                    key={index}
                    href={link.url}
                    className="text-black me-3 text-decoration-none fw-semibold"
                    title={link.name}
                    target={link.url.startsWith("http") ? "_blank" : "_self"}
                    rel={
                      link.url.startsWith("http") ? "noopener noreferrer" : ""
                    }
                    aria-label={`Visit ${link.name}`}
                  >
                    {link.text}
                  </a>
                );
              })}
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
                    className="text-black text-decoration-none"
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
            <p className="text-black mb-3">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:your.bryllejheraldo@gmail.com"
                className="text-black text-decoration-none"
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
        <hr className="my-4 border-dark" />
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0">
              &copy; 2025 Brylle Justin Lara Heraldo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
