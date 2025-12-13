import React from "react";

const Certifications: React.FC = () => {
  const certifications = [
    {
      title: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023",
      credentialId: "AWS-SA-12345",
      image: "https://via.placeholder.com/150x100",
      verificationUrl: "#",
    },
    {
      title: "Professional Scrum Master (PSM I)",
      issuer: "Scrum.org",
      date: "2023",
      credentialId: "PSM-12345",
      image: "https://via.placeholder.com/150x100",
      verificationUrl: "#",
    },
    {
      title: "Google Cloud Professional Developer",
      issuer: "Google Cloud",
      date: "2022",
      credentialId: "GCP-PD-67890",
      image: "https://via.placeholder.com/150x100",
      verificationUrl: "#",
    },
    {
      title: "MongoDB Certified Developer",
      issuer: "MongoDB University",
      date: "2022",
      credentialId: "MONGODB-DEV-54321",
      image: "https://via.placeholder.com/150x100",
      verificationUrl: "#",
    },
    {
      title: "React Developer Certification",
      issuer: "Meta (Facebook)",
      date: "2021",
      credentialId: "META-REACT-98765",
      image: "https://via.placeholder.com/150x100",
      verificationUrl: "#",
    },
    {
      title: "Docker Certified Associate",
      issuer: "Docker Inc.",
      date: "2021",
      credentialId: "DOCKER-CA-13579",
      image: "https://via.placeholder.com/150x100",
      verificationUrl: "#",
    },
  ];

  return (
    <section id="certifications" className="bg-light py-5">
      <div className="container">
        <h2 className="text-center mb-5">Certifications & Achievements</h2>
        <div className="row">
          {certifications.map((cert, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={cert.image}
                      alt={cert.title}
                      className="me-3"
                      style={{
                        width: "60px",
                        height: "40px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <h6 className="card-title mb-1">{cert.title}</h6>
                      <small className="text-muted">{cert.issuer}</small>
                    </div>
                  </div>
                  <p className="card-text">
                    <strong>Issued:</strong> {cert.date}
                    <br />
                    <strong>Credential ID:</strong> {cert.credentialId}
                  </p>
                  <a
                    href={cert.verificationUrl}
                    className="btn btn-outline-primary btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Verify Certificate
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Achievements */}
        <div className="mt-5">
          <h3 className="text-center mb-4">Additional Achievements</h3>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    🏆 Winner - Best Web Application (Tech Conference 2023)
                  </span>
                  <span className="badge bg-primary rounded-pill">2023</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>📝 Published 5+ technical articles on Medium</span>
                  <span className="badge bg-success rounded-pill">
                    2022-2023
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>🎯 100+ GitHub contributions in the last year</span>
                  <span className="badge bg-info rounded-pill">2023</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>👥 Mentored 10+ junior developers</span>
                  <span className="badge bg-warning text-dark rounded-pill">
                    2022-2023
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>🎤 Speaker at 3 tech meetups</span>
                  <span className="badge bg-secondary rounded-pill">2023</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certifications;
