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
                I’m a developer with experience in web development, mobile
                applications, game development, software development, and 3D
                design.
              </p>
              <p>
                I enjoy learning new technologies and applying what I know to
                create useful and engaging solutions. Working with different
                stacks has helped me understand how ideas move from concept to
                implementation across various platforms.
              </p>
              <p>
                I’m especially interested in building projects that are
                practical, user-friendly, and well-structured. Whether it’s a
                small personal project or a larger application, I value clean
                code, thoughtful design, and continuous improvement through
                hands-on experience.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
