import React, { useState, useEffect } from "react";

const Projects: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setShowModal(true);
    setCurrentSlide(0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProject(null);
    setCurrentSlide(0);
  };

  const nextSlide = () => {
    if (selectedProject) {
      setCurrentSlide((prev) => 
        prev === selectedProject.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevSlide = () => {
    if (selectedProject) {
      setCurrentSlide((prev) => 
        prev === 0 ? selectedProject.images.length - 1 : prev - 1
      );
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const hoverStyles = `
    .project-card:hover {
      transform: scale(1.05);
      transition: transform 0.2s;
    }
    
    .carousel-control-prev-icon,
    .carousel-control-next-icon {
      background-color: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      padding: 20px;
    }
    
    .carousel-control-prev:hover .carousel-control-prev-icon,
    .carousel-control-next:hover .carousel-control-next-icon {
      background-color: rgba(0, 0, 0, 0.9);
    }
    
    .carousel-indicators button {
      background-color: rgba(0, 0, 0, 0.5) !important;
    }
    
    .carousel-indicators button.active {
      background-color: rgba(0, 0, 0, 0.9) !important;
    }
  `;

  const projects = [
    {
      title: "TrabTrack",
      description:
        "TrabTrack is a free web-based job application tracker that helps users organize and monitor their job search in one place. It provides a centralized dashboard showing application statuses, activity history, progress tracking, and upcoming interviews. Users can easily add, edit, and delete job entries, while the Job Hunt section offers links to popular job search platforms to discover new opportunities.",
      image: "./src/assets/jobtracker.png",
      technologies: ["HTML", "CSS", "Javascript", "PHP", "Bootstrap"],
      liveUrl: "https://trabtrack.com/",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./src/assets/trabtrack/trab1.jpeg",
        "./src/assets/trabtrack/trab2.jpeg",
        "./src/assets/trabtrack/trab3.jpeg",
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
        "./src/assets/journeybox/journ.jpeg",
        "./src/assets/journeybox/journ2.jpeg",
        "./src/assets/journeybox/journ3.jpeg",
        "./src/assets/journeybox/journ4.jpeg",
        "./src/assets/journeybox/journ5.jpeg",
        "./src/assets/journeybox/journ6.jpeg",
        "./src/assets/journeybox/journ7.jpeg",
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
        "./src/assets/driving/drive7.jpeg",
        "./src/assets/driving/drive2.jpeg",
        "./src/assets/driving/drive3.jpeg",
        "./src/assets/driving/drive4.jpeg",
        "./src/assets/driving/drive5.jpeg",
        "./src/assets/driving/drive6.jpeg",
      ],
    },
    {
      title: "Leave Tracking System for HR",
      description:
        "The Leave Tracking System is a web-based, paperless solution for LGU-Talisay's HRMO that streamlines the management of employee leave and travel applications. It enables efficient record-keeping, automated reports, printable forms, and calendar-based tracking, improving accuracy, transparency, and overall HR operations.",
      image: "./src/assets/LTrack.png",
      technologies: ["HTML", "CSS", "Bootstrap", "Javascript", "PHP", "MySQL"],
      liveUrl: "#",
      githubUrl: "#",
      collaboration: "Team Project",
      images: [
        "./src/assets/LTrack.png",
        "./src/assets/leave/hr1.png",
        "./src/assets/leave/hr2.png",
        "./src/assets/leave/hr3.png",
        "./src/assets/leave/hr4.png",
        "./src/assets/leave/hr5.png",
      ],
    },
    {
      title: "LTO Licensing Queueing System Simulation",
      description:
        "A process-based model designed to represent the actual workflow of the Land Transportation Office’s licensing operations.",
      image: "./src/assets/lto/lto.png",
      technologies: ["Python", "Pygame", "Tkinter", "Simulation"],
      liveUrl: "https://drive.google.com/drive/folders/1yIKmtypsRRm_3wrMNM9aqzl_G9M7LACU?usp=sharing",
      githubUrl: "https://github.com/TeruhashiN/LTO_Queueing_Simulation",
      collaboration: "Team Project",
      images: [
        "./src/assets/lto/lto.png",
        "./src/assets/lto/lto2.png",
        "./src/assets/lto/lto3.png",
        "./src/assets/lto/lto4.png",
        "./src/assets/lto/lto5.png",
        "./src/assets/lto/lto6.png",
      ],
    },
    {
      title: "3D Structure & Design",
      description:
        "This section presents the 3D structures developed for the driving simulation, including environment and road designs essential to the system’s functionality. It also features independent creative projects such as the Southpark-themed environment and other self-made designs, created to showcase modeling skills and environmental creativity.",
      image: "./src/assets/design/des12.jpeg",
      technologies: ["3Ds Max", "Unreal Engine"],
      liveUrl: "#",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./src/assets/design/des11.png",
        "./src/assets/design/des.jpeg",
        "./src/assets/design/des2.jpeg",
        "./src/assets/design/des3.jpeg",
        "./src/assets/design/des4.jpeg",
        "./src/assets/design/des5.jpeg",
        "./src/assets/design/des6.jpeg",
        "./src/assets/design/des7.jpeg",
        "./src/assets/design/des8.jpeg",
        "./src/assets/design/des9.jpeg",
        "./src/assets/design/des10.jpeg",
        "./src/assets/design/des11.png",
        "./src/assets/design/des12.jpeg",
        "./src/assets/design/Loftia.png",

      ],
    },
  ];

  return (
    <section id="projects" className="py-5">
      <style>{hoverStyles}</style>
      <div className="container">
        <h2 className="text-center mb-5">Featured Projects</h2>
        <div className="row">
          {projects.map((project, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              <div
                className="section-border h-100 d-flex flex-column project-card"
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
                <div className="d-flex flex-column flex-grow-1 p-3">
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
                  {/* Custom Carousel */}
                  <div className="carousel slide position-relative" style={{ backgroundColor: "#f8f9fa" }}>
                    {/* Carousel Indicators */}
                    <div className="carousel-indicators">
                      {selectedProject.images.map((_: string, imgIndex: number) => (
                        <button
                          key={imgIndex}
                          type="button"
                          onClick={() => goToSlide(imgIndex)}
                          className={imgIndex === currentSlide ? "active" : ""}
                          aria-current={imgIndex === currentSlide ? "true" : "false"}
                          aria-label={`Slide ${imgIndex + 1}`}
                        ></button>
                      ))}
                    </div>

                    {/* Carousel Inner */}
                    <div className="carousel-inner">
                      {selectedProject.images.map((img: string, imgIndex: number) => (
                        <div
                          key={imgIndex}
                          className={`carousel-item ${imgIndex === currentSlide ? "active" : ""}`}
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
                      ))}
                    </div>

                    {/* Carousel Controls */}
                    <button
                      className="carousel-control-prev"
                      type="button"
                      onClick={prevSlide}
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
                      onClick={nextSlide}
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