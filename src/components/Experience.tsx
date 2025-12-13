import React from "react";

const Experience: React.FC = () => {
  return (
    <section id="experience" className="bg-light py-5">
      <div className="container">
        <h2 className="text-center mb-5">Professional Experience</h2>
        <div className="row">
          <div className="col-lg-10 mx-auto">
            {/* Experience Item 1 */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <h5 className="card-title">Full Stack Developer</h5>
                    <h6 className="text-primary">Local Government Talisay - Internship| February 2025 - May 2025</h6>
                    <ul className="mt-3">
                      <li>
                        Developed responsive web applications from concept to
                        deployment
                      </li>
                      <li>
                        Built RESTful APIs and integrated third-party services
                      </li>
                      <li>
                        Optimized application performance and user experience
                      </li>
                      <li>
                        Participated in agile development processes and sprint
                        planning
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-4">
                    <span className="badge bg-success mb-2">HTML</span>
                    <span className="badge bg-success mb-2">CSS</span>
                    <span className="badge bg-success mb-2">JavaScript</span>
                    <span className="badge bg-success mb-2">PHP</span>
                    <span className="badge bg-success mb-2">MongoDB</span>
                  </div>
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
