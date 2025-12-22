import React, { useState } from "react";

const Projects: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  const projects = [
    {
      title: "TrabTrack",
      description:
        "TrabTrack is a free web-based job application tracker that helps users organize and monitor their job search in one place. It provides a centralized dashboard showing application statuses, activity history, progress tracking, and upcoming interviews. Users can easily add, edit, and delete job entries, while the Job Hunt section offers links to popular job search platforms to discover new opportunities.",
      image: "./src/assets/jobtrack.png",
      technologies: ["HTML", "CSS", "Javascript", "PHP", "Bootstrap"],
      liveUrl: "https://trabtrack.com/",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./src/assets/jobtrack.png",
        "https://via.placeholder.com/400x250",
        "https://via.placeholder.com/400x250",
      ],
    },
    {
      title: "JourneyBox",
      description:
        "JourneyBox is a smart offline travel companion that lets users track trips, store travel details, and preserve memories securely—even without internet access.",
      image: "./src/assets/journeyboxs.png",
      technologies: ["Flutter", "Dart"],
      liveUrl:
        "https://www.linkedin.com/feed/update/urn:li:activity:7391098451155079168/",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./src/assets/journeyboxs.png",
        "https://via.placeholder.com/400x250",
        "https://via.placeholder.com/400x250",
      ],
    },
    {
      title: "DriveWise: 3D Driving Simulation",
      description:
        "A 3D driving simulation capstone project featuring a manual car system with steering wheel controls, built using Unreal Engine and 3ds Max. The simulation recreates a subdivision and central Daet, Camarines Norte, showcasing local landmarks through an immersive driving experience.",
      image: "./src/assets/drive.png",
      technologies: ["Unreal Engine", "Blueprint Visual Scripting", "3Ds Max"],
      liveUrl:
        "https://www.linkedin.com/feed/update/urn:li:activity:7275130093692174336/",
      githubUrl: "#",
      collaboration: "Team Project",
      images: [
        "./src/assets/drive.png",
        "https://via.placeholder.com/400x250",
        "https://via.placeholder.com/400x250",
      ],
    },
    {
      title: "Leave Tracking System for HR",
      description:
        "The Leave Tracking System is a web-based, paperless solution for LGU-Talisay’s HRMO that streamlines the management of employee leave and travel applications. It enables efficient record-keeping, automated reports, printable forms, and calendar-based tracking, improving accuracy, transparency, and overall HR operations.",
      image: "./src/assets/LTrack.png",
      technologies: ["HTML", "CSS", "Bootstrap", "Javascript", "PHP", "MySQL"],
      liveUrl: "#",
      githubUrl: "#",
      collaboration: "Team Project",
      images: [
        "./src/assets/LTrack.png",
        "https://via.placeholder.com/400x250",
        "https://via.placeholder.com/400x250",
      ],
    },
    {
      title: "Portfolio Website",
      description:
        "A modern, responsive portfolio website built with React and Bootstrap, featuring smooth animations and optimized performance.",
      image: "https://via.placeholder.com/400x250",
      technologies: ["React", "Bootstrap", "TypeScript", "Vite"],
      liveUrl: "#",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "https://via.placeholder.com/400x250",
        "https://via.placeholder.com/400x250",
        "https://via.placeholder.com/400x250",
      ],
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
              <div
                className="section-border h-100 d-flex flex-column"
                onClick={() => handleProjectClick(project)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={project.image}
                  className="card-img-top"
                  alt={project.title}
                  style={{
                    width: "100%",
                    height: "250px",
                    objectFit: "contain",
                    objectPosition: "center",
                  }}
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      Live Demo
                    </a>
                    <a
                      href={project.githubUrl}
                      className="btn btn-outline-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && selectedProject && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={handleCloseModal}
          >
            <div
              className="modal-dialog modal-lg"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedProject.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Carousel */}
                  <div
                    id="projectCarousel"
                    className="carousel slide"
                    data-bs-ride="carousel"
                  >
                    <div className="carousel-inner">
                      {selectedProject.images.map(
                        (img: string, imgIndex: number) => (
                          <div
                            key={imgIndex}
                            className={`carousel-item ${
                              imgIndex === 0 ? "active" : ""
                            }`}
                          >
                            <img
                              src={img}
                              className="d-block w-100"
                              alt={`Slide ${imgIndex + 1}`}
                              style={{
                                height: "300px",
                                objectFit: "contain",
                                objectPosition: "center",
                              }}
                            />
                          </div>
                        )
                      )}
                    </div>
                    <button
                      className="carousel-control-prev"
                      type="button"
                      data-bs-target="#projectCarousel"
                      data-bs-slide="prev"
                    >
                      <span
                        className="carousel-control-prev-icon"
                        aria-hidden="true"
                      ></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button
                      className="carousel-control-next"
                      type="button"
                      data-bs-target="#projectCarousel"
                      data-bs-slide="next"
                    >
                      <span
                        className="carousel-control-next-icon"
                        aria-hidden="true"
                      ></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </div>

                  {/* Description */}
                  <p className="mt-3">{selectedProject.description}</p>

                  {/* Details (Technologies) */}
                  <h6>Technologies:</h6>
                  <div className="mb-3">
                    {selectedProject.technologies.map(
                      (tech: string, techIndex: number) => (
                        <span
                          key={techIndex}
                          className="badge bg-secondary me-1 mb-1"
                        >
                          {tech}
                        </span>
                      )
                    )}
                  </div>

                  {/* Collaboration */}
                  <h6>Collaboration:</h6>
                  <p>{selectedProject.collaboration}</p>

                  {/* Links */}
                  <div>
                    <a
                      href={selectedProject.liveUrl}
                      className="btn btn-primary me-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live Demo
                    </a>
                    <a
                      href={selectedProject.githubUrl}
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
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
