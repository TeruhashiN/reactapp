import React from "react";

const Skills: React.FC = () => {
  return (
    <section id="skills" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="mb-4">Technical Skills</h2>
            <div className="section-border">
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
    </section>
  );
};

export default Skills;
