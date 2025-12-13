import React from "react";

const Footer: React.FC = () => {
  const socialLinks = [
    { name: "LinkedIn", url: "#", icon: "🔗" },
    { name: "GitHub", url: "#", icon: "💻" },
    { name: "Twitter", url: "#", icon: "🐦" },
    { name: "Email", url: "mailto:your.email@example.com", icon: "✉️" },
  ];

  const quickLinks = [
    { name: "About", href: "#about" },
    { name: "Experience", href: "#experience" },
    { name: "Projects", href: "#projects" },
    { name: "Certifications", href: "#certifications" },
  ];

  return (
    <footer className="bg-dark text-white py-5">
      <div className="container">
        <div className="row">
          {/* About Section */}
          <div className="col-lg-4 mb-4">
            <h5>Your Name</h5>
            <p className="text-light">
              Full Stack Developer passionate about creating innovative
              solutions and building amazing web experiences.
            </p>
            <div className="d-flex">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="text-white me-3 fs-5"
                  title={link.name}
                  target={link.url.startsWith("http") ? "_blank" : "_self"}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : ""}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-4 mb-4">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              {quickLinks.map((link, index) => (
                <li key={index} className="mb-2">
                  <a
                    href={link.href}
                    className="text-light text-decoration-none"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-4 mb-4">
            <h5>Get In Touch</h5>
            <p className="text-light">
              <strong>Email:</strong> your.email@example.com
              <br />
              <strong>Phone:</strong> +1 (555) 123-4567
              <br />
              <strong>Location:</strong> Your City, Country
            </p>

            {/* Contact Form */}
            <form className="mt-3">
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Your Name"
                  required
                />
              </div>
              <div className="mb-2">
                <input
                  type="email"
                  className="form-control form-control-sm"
                  placeholder="Your Email"
                  required
                />
              </div>
              <div className="mb-2">
                <textarea
                  className="form-control form-control-sm"
                  placeholder="Your Message"
                  rows={2}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <hr className="my-4" />
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">&copy; 2024 Your Name. All rights reserved.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0">Built with ❤️ using React & Bootstrap</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
