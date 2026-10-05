import React from "react";

const About: React.FC = () => {
  const highlights = [
    {
      title: "Full-Stack Development",
      description: "Building responsive, user-centric web and mobile solutions with clean architecture, maintainability, and performance at the core.",
      icon: "fas fa-code",
    },
    {
      title: "Workflow Automation",
      description: "Designing end-to-end automated pipelines with n8n, webhooks, and RESTful API integrations to reduce manual overhead.",
      icon: "fas fa-cogs",
    },
    {
      title: "Data & Systems Design",
      description: "Optimizing relational databases (MySQL), schema migrations, and delivering actionable insights through analytical data processing.",
      icon: "fas fa-database",
    },
  ];

  return (
    <section id="about" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-12 mx-auto">
            <h2 className="text-center mb-4">About Me</h2>

            {/* About Me Narrative Card */}
            <div className="section-border mb-4 text-start">
              <p className="lead mb-3">
                I am a <strong>Software Engineer and Full-Stack Developer</strong> dedicated to building scalable web systems, robust backends, and intelligent workflow automations. Transitioning into technology with a background in Agriculture instilled in me a unique foundation of resilience, systematic problem-solving, and an unwavering commitment to continuous learning.
              </p>

              <p className="mb-3">
                With hands-on experience developing production-grade logistics management systems, custom business platforms, and automated data workflows, I specialize in bridging complex backend operations with intuitive user experiences. My engineering approach centers on writing clean, maintainable code, architecting efficient relational databases, and eliminating operational friction through modern automation tools like <strong>n8n</strong> and RESTful APIs.
              </p>

              <p className="mb-0">
                Driven by curiosity and impact, I am actively expanding my expertise in <strong>Data Analytics</strong> and <strong>Artificial Intelligence</strong>. I thrive in collaborative, fast-paced environments where I can leverage technology, data-driven insights, and sound software engineering principles to solve real-world challenges and deliver tangible value.
              </p>
            </div>

            {/* Core Competencies Highlights */}
            <div className="row g-3 text-start">
              {highlights.map((item, index) => (
                <div key={index} className="col-md-4">
                  <div className="section-border h-100 p-3 bg-light">
                    <div className="d-flex align-items-center mb-2">
                      <i className={`${item.icon} text-primary me-2 fs-5`}></i>
                      <h6 className="card-title text-dark mb-0 fw-bold">{item.title}</h6>
                    </div>
                    <p className="card-text text-muted mb-0">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
