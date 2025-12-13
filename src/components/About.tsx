import React from "react";

const About: React.FC = () => {
  return (
    <section id="about" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="mb-4">About Me</h2>

            {/* About Me Card */}
            <div className="card mb-4">
              <div className="card-body">
                <p className="lead">
                  I’m a developer with experience in web development, mobile
                  applications, game development, software development, and 3D
                  design.
                </p>
                <p>
                  I enjoy learning new technologies and applying what I know to
                  create useful and engaging solutions. Working with different
                  stacks has helped me understand how ideas move from concept
                  to implementation across various platforms.
                </p>
                <p>
                  I’m especially interested in building projects that are
                  practical, user-friendly, and well-structured. Whether it’s
                  a small personal project or a larger application, I value
                  clean code, thoughtful design, and continuous improvement
                  through hands-on experience.
                </p>
              </div>
            </div>

            {/* Tech Stacks Section */}
            <div className="mt-5">
              <h3 className="mb-4">Technical Skills</h3>
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h5 className="text-primary">Frontend</h5>
                      <ul className="list-unstyled">
                        <li>• React.js / Next.js</li>
                        <li>• TypeScript / JavaScript (ES6+)</li>
                        <li>• HTML5 / CSS3 / Sass</li>
                        <li>• Bootstrap / Tailwind CSS</li>
                        <li>• Redux / Context API</li>
                        <li>• Vue.js</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h5 className="text-primary">Backend</h5>
                      <ul className="list-unstyled">
                        <li>• Node.js / Express.js</li>
                        <li>• Python / Django / Flask</li>
                        <li>• Java / Spring Boot</li>
                        <li>• MongoDB / PostgreSQL</li>
                        <li>• RESTful APIs / GraphQL</li>
                        <li>• Docker / Kubernetes</li>
                      </ul>
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

export default About;
