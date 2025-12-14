import React from "react";

const Projects: React.FC = () => {
  const projects = [
    {
      title: "TrabTrack",
      description:
        "TrabTrack is a free web-based job application tracker that helps users organize and monitor their job search in one place. It provides a centralized dashboard showing application statuses, activity history, progress tracking, and upcoming interviews. Users can easily add, edit, and delete job entries, while the Job Hunt section offers links to popular job search platforms to discover new opportunities.",
      image: "./src/assets/jobtrack.png",
      technologies: ["HTML", "CSS", "Javascript", "PHP", "Bootstrap"],
      liveUrl: "https://trabtrack.com/",
      githubUrl: "#",
    },
    {
      title: "JourneyBox",
      description:
        "JourneyBox is a smart offline travel companion that lets users track trips, store travel details, and preserve memories securely—even without internet access.",
      image: "./src/assets/drive.png",
      technologies: ["Flutter", "Dart"],
      liveUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7391098451155079168/",
      githubUrl: "#",
    },
    {
      title: "DriveWise: 3D Driving Simulation",
      description:
        "A 3D driving simulation capstone project featuring a manual car system with steering wheel controls, built using Unreal Engine and 3ds Max. The simulation recreates a subdivision and central Daet, Camarines Norte, showcasing local landmarks through an immersive driving experience.",
      image: "./src/assets/drive.png",
      technologies: ["Unreal Engine", "Blueprint Visual Scripting", "3Ds Max"],
      liveUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7275130093692174336/",
      githubUrl: "#",
    },
    {
      title: "Portfolio Website",
      description:
        "A modern, responsive portfolio website built with React and Bootstrap, featuring smooth animations and optimized performance.",
      image: "https://via.placeholder.com/400x250",
      technologies: ["React", "Bootstrap", "TypeScript", "Vite"],
      liveUrl: "#",
      githubUrl: "#",
    },
    {
      title: "Chat Application",
      description:
        "A real-time chat application with user authentication, private messaging, and group chat functionality.",
      image: "https://via.placeholder.com/400x250",
      technologies: ["React", "Firebase", "Material-UI", "WebSocket"],
      liveUrl: "#",
      githubUrl: "#",
    },
    {
      title: "Data Visualization Tool",
      description:
        "An interactive data visualization dashboard for business analytics with customizable charts and reporting features.",
      image: "https://via.placeholder.com/400x250",
      technologies: ["D3.js", "React", "Python", "Flask"],
      liveUrl: "#",
      githubUrl: "#",
    },
  ];

  return (
    <section id="projects" className="py-5">
      <div className="container">
        <h2 className="text-center mb-5">Featured Projects</h2>
        <div className="row">
          {projects.map((project, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              <div className="section-border h-100 d-flex flex-column">
                <img
                  src={project.image}
                  className="card-img-top"
                  alt={project.title}
                />
                <div className="d-flex flex-column flex-grow-1">
                  <h5 className="card-title">{project.title}</h5>
                  <p className="card-text">{project.description}</p>

                  {/* Technologies */}
                  <div className="mb-3">
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="badge bg-secondary me-1 mb-1"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto">
                    <a
                      href={project.liveUrl}
                      className="btn btn-primary me-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live Demo
                    </a>
                    <a
                      href={project.githubUrl}
                      className="btn btn-outline-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
