import React from "react";

const Certifications: React.FC = () => {
  const certifications = [
    {
      title: "ICT Industry Masterclass in Python Programming",
      issuer: "Huawei",
      date: "May 2022",
      image: "./src/assets/huaweidp.png",
      verificationUrl: "https://drive.google.com/file/d/1TiTXtVK-iYshNX-Qy21FASenGqA1InUy/view?usp=sharing",
    },
    {
      title: "Dean's Lister ",
      issuer: "Camarines Norte State College - College of Computing and Multimedia Studies ",
      date: "June 2023",
      credentialId: "",
      image: "./src/assets/ccms.jpg",
      verificationUrl: "https://drive.google.com/drive/folders/1WNX4wQynNlkt33gIUDhKILCD4lizBeH8?usp=sharing",
    },
    {
      title: "Google AI Essentials",
      issuer: "Google",
      date: "December 2024",
      credentialId: "YBJI1T7JOJBM",
      image: "./src/assets/google.png",
      verificationUrl: "https://www.coursera.org/account/accomplishments/verify/YBJI1T7JOJBM",
    },
    {
      title: "OPSWAT Introduction to Critical Infrastructure Protection (ICIP)",
      issuer: "OPSWAT",
      date: "February 2025",
      credentialId: "",
      image: "./src/assets/opswat.png",
      verificationUrl: "https://www.credly.com/badges/221a4d6d-29a6-482f-a6ad-3d79ac33f8f2/linked_in_profile",
    },
    {
      title: "Flutter & Dart",
      issuer: "Udemy",
      date: "April 2025 - December 2035",
      credentialId: "UC-8c535836-6ada-4661-bd89-2fc994056e36",
      image: "./src/assets/udemy.png",
      verificationUrl: "https://www.udemy.com/certificate/UC-8c535836-6ada-4661-bd89-2fc994056e36/",
    },
    {
      title: "Multicloud Network Associate",
      issuer: "Aviatrix",
      date: "July 2025 - July 2028",
      credentialId: "2025-25347",
      image: "./src/assets/avia.png",
      verificationUrl: "https://www.credly.com/badges/ed65649b-0ea8-4f31-8720-191577e94022/linked_in_profile",
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
            <div className="col-lg-12 mx-auto">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    🖼️ LOFTIA Fanart Competition - 3D Design 
                  </span>
                  <span className="badge bg-primary rounded-pill">2025</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>📝 3D Game Development </span>
                  <span className="badge bg-success rounded-pill">
                    2024
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>🎯 Python Programming Competition</span>
                  <span className="badge bg-info rounded-pill">2023</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>👥 Mobile App Competition</span>
                  <span className="badge bg-warning text-dark rounded-pill">
                    2023
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>🎤 Design Expo 2022</span>
                  <span className="badge bg-secondary rounded-pill">2022</span>
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
