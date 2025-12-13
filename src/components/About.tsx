import React from "react";

const About: React.FC = () => {
  return (
    <section id="about" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="mb-4">About Me</h2>
            <div className="card mb-4">
              <div className="card-body">
                <p className="lead">
                  I'm a passionate developer with experience in creating web
                  applications. I love turning ideas into reality through code
                  and design.
                </p>
                <p>
                  With a background in computer science and a keen interest in
                  emerging technologies, I strive to build efficient,
                  user-friendly solutions that make a difference.
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
