import React from "react";

const About: React.FC = () => {
  return (
    <section id="about" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-12 mx-auto text-center">
            <h2 className="mb-4">About Me</h2>

            {/* About Me Card */}
            <div className="section-border mb-4">
              <p className="lead">
                I'm a Software Developer and Data Analytics enthusiast with experience in
                web development, mobile applications, software solutions, game development,
                and 3D design. My journey into technology began after transitioning from an
                Agriculture background, which taught me resilience, adaptability, and a
                strong commitment to continuous learning.
              </p>

              <p>
                Over the years, I have developed projects using modern technologies across
                multiple platforms, gaining hands-on experience in full-stack development,
                database management, UI/UX design, and data analysis. I enjoy building
                applications that are both practical and impactful, with a focus on
                performance, usability, and maintainability.
              </p>

              <p>
                Currently, I am expanding my expertise in Data Analytics and Artificial
                Intelligence while continuing to strengthen my software development skills.
                I am passionate about leveraging technology and data-driven insights to
                create innovative solutions that address real-world challenges and deliver
                meaningful results.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
