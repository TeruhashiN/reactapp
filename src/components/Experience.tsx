import React from "react";

const Experience: React.FC = () => {
  return (
    <section id="experience" className="bg-light py-5">
      <div className="container">
        <h2 className="text-center mb-5">Professional Experience</h2>
        <div className="row">
          <div className="col-lg-10 mx-auto">
            {/* Experience Item 1 */}
            <div className="section-border mb-4">
              <div className="row">
                <div className="col-md-8">
                  <h5 className="card-title">Full Stack Developer Intern</h5>
                  <h6 className="text-primary">
                    Local Government Unit of Talisay – HR Department | February 2025 – May
                    2025
                  </h6>
                  <ul className="mt-3">
                    <li>
                      Designed and developed a web-based HR system for LGU Talisay employees
                      to manage and track leave applications.
                    </li>
                    <li>
                      Implemented Service Incentive Leave (SIL) monitoring, allowing HR
                      personnel to accurately record, update, and validate employee leave
                      balances.
                    </li>
                    <li>
                      Built features for filing, approving, and rejecting leave requests,
                      improving efficiency and reducing manual paperwork.
                    </li>
                    <li>
                      Developed secure user roles for employees and HR staff to ensure proper
                      access control and data privacy.
                    </li>
                    <li>
                      Collaborated with HR personnel to gather requirements and improve the
                      system based on real operational workflows.
                    </li>
                  </ul>
                </div>
                <div className="col-md-4">
                  <span className="badge bg-success mb-2 me-1">HTML</span>
                  <span className="badge bg-success mb-2 me-1">CSS</span>
                  <span className="badge bg-success mb-2 me-1">JavaScript</span>
                  <span className="badge bg-success mb-2 me-1">PHP</span>
                </div>
              </div>
            </div>

            {/* Experience Item – Freelancing */}
            <div className="section-border mb-4">
              <div className="row">
                <div className="col-md-8">
                  <h5 className="card-title">
                    Software Developer | Web Developer | Mobile Application Developer | Game
                    Developer | 3D Designer |
                  </h5>
                  <h6 className="text-primary">
                    Freelance Projects & Confidential Business Clients | June 2022 – Present
                  </h6>

                  <ul className="mt-3">
                    <li>
                      Delivered custom software solutions for confidential business clients,
                      ensuring data privacy, secure access, and project confidentiality.
                    </li>
                    <li>
                      Developed Python-based simulations for academic and real-world
                      scenarios, including traffic and process simulations such as LTO
                      systems.
                    </li>
                    <li>
                      Designed and built responsive websites for student and business
                      projects, including resort websites, coffee shop websites, e-commerce
                      platforms, booking systems, and hotel management systems.
                    </li>
                    <li>
                      Created mobile applications for various use cases such as tracking
                      systems, library management systems, and e-commerce-style applications.
                    </li>
                    <li>
                      Produced 3D architectural designs for student and client projects,
                      including multiple residential house models using 3Ds Max.
                    </li>
                    <li>
                      Developed interactive game environments by integrating custom 3D house
                      models with gameplay logic and system mechanics.
                    </li>
                  </ul>
                </div>

                <div className="col-md-4">
                  <span className="badge bg-success mb-2 me-1">Python</span>
                  <span className="badge bg-success mb-2 me-1">C++</span>
                  <span className="badge bg-success mb-2 me-1">C#</span>
                  <span className="badge bg-success mb-2 me-1">Java</span>
                  <span className="badge bg-success mb-2 me-1">HTML</span>
                  <span className="badge bg-success mb-2 me-1">CSS</span>
                  <span className="badge bg-success mb-2 me-1">Bootstrap</span>
                  <span className="badge bg-success mb-2 me-1">Tailwind</span>
                  <span className="badge bg-success mb-2 me-1">JavaScript</span>
                  <span className="badge bg-success mb-2 me-1">TypeScript</span>
                  <span className="badge bg-success mb-2 me-1">PHP</span>
                  <span className="badge bg-success mb-2 me-1">React</span>
                  <span className="badge bg-success mb-2 me-1">Node.js</span>
                  <span className="badge bg-success mb-2 me-1">MongoDB</span>
                  <span className="badge bg-success mb-2 me-1">Flutter</span>
                  <span className="badge bg-success mb-2 me-1">Dart</span>
                  <span className="badge bg-success mb-2 me-1">Android Studio</span>
                  <span className="badge bg-success mb-2 me-1">Kotlin</span>
                  <span className="badge bg-success mb-2 me-1">Unreal Engine</span>
                  <span className="badge bg-success mb-2 me-1">3Ds Max</span>
                </div>
              </div>
            </div>




            {/* Education Section */}
            <div className="mt-5">
              <h3 className="mb-4">Education</h3>
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <h5 className="card-title">
                        Bachelor of Science in Information Technology
                      </h5>
                      <h6 className="text-primary">
                        Camarines Norte State College | 2021 - 2025
                      </h6>
                      <p className="mt-3">
                        Graduated with honors, specializing in software
                        engineering and web development.
                      </p>
                    </div>
                    <div className="col-md-4">
                      <span className="badge bg-warning text-dark mb-2">
                        GWA: 1.7
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
