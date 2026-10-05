import React, { useState } from "react";

const Projects: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  type Project = {
    title: string;
    description: string;
    image: string;
    technologies: string[];
    liveUrl: string;
    githubUrl: string;
    collaboration: string;
    images: string[];
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotAvailableModal, setShowNotAvailableModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowModal(true);
    setCurrentSlide(0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProject(null);
    setCurrentSlide(0);
  };

  const handleCloseNotAvailableModal = () => {
    setShowNotAvailableModal(false);
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    if (url === "#") {
      e.preventDefault();
      setShowNotAvailableModal(true);
    }
  };

  const nextSlide = () => {
    if (selectedProject) {
      setCurrentSlide((prev) =>
        prev === selectedProject.images.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const prevSlide = () => {
    if (selectedProject) {
      setCurrentSlide((prev) =>
        prev === 0 ? selectedProject.images.length - 1 : prev - 1,
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
      background-color: rgba(15, 23, 42, 0.75);
      border-radius: 50%;
      padding: 14px;
      background-size: 55%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }
    
    .carousel-control-prev:hover .carousel-control-prev-icon,
    .carousel-control-next:hover .carousel-control-next-icon {
      background-color: rgba(15, 23, 42, 0.95);
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
      image: "./images/Jobtracker.png",
      technologies: ["HTML", "CSS", "Javascript", "PHP", "Bootstrap"],
      liveUrl: "https://trabtrack.com/",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./images/trabtrack/trab1.jpeg",
        "./images/trabtrack/trab2.jpeg",
        "./images/trabtrack/trab3.jpeg",
      ],
    },
    {
      title: "JourneyBox",
      description:
        "JourneyBox is a smart offline travel companion that lets users track trips, store travel details, and preserve memories securely—even without internet access.",
      image: "./images/journeyboxs.png",
      technologies: ["Flutter", "Dart"],
      liveUrl:
        "https://www.linkedin.com/feed/update/urn:li:activity:7391098451155079168/",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./images/journeybox/journ.jpeg",
        "./images/journeybox/journ2.jpeg",
        "./images/journeybox/journ3.jpeg",
        "./images/journeybox/journ4.jpeg",
        "./images/journeybox/journ5.jpeg",
        "./images/journeybox/journ6.jpeg",
        "./images/journeybox/journ7.jpeg",
      ],
    },
    {
      title: "DriveWise: 3D Driving Simulation",
      description:
        "A 3D driving simulation capstone project featuring a manual car system with steering wheel controls, built using Unreal Engine and 3ds Max. The simulation recreates a subdivision and central Daet, Camarines Norte, showcasing local landmarks through an immersive driving experience.",
      image: "./images/drive.png",
      technologies: ["Unreal Engine", "Blueprint Visual Scripting", "3Ds Max"],
      liveUrl:
        "https://www.linkedin.com/feed/update/urn:li:activity:7275130093692174336/",
      githubUrl: "#",
      collaboration: "Team Project",
      images: [
        "./images/drive.png",
        "./images/driving/drive7.jpeg",
        "./images/driving/drive2.jpeg",
        "./images/driving/drive3.jpeg",
        "./images/driving/drive4.jpeg",
        "./images/driving/drive5.jpeg",
        "./images/driving/drive6.jpeg",
      ],
    },
    {
      title: "Leave Tracking System for HR",
      description:
        "The Leave Tracking System is a web-based, paperless solution for LGU-Talisay's HRMO that streamlines the management of employee leave and travel applications. It enables efficient record-keeping, automated reports, printable forms, and calendar-based tracking, improving accuracy, transparency, and overall HR operations.",
      image: "./images/LTrack.png",
      technologies: ["HTML", "CSS", "Bootstrap", "Javascript", "PHP", "MySQL"],
      liveUrl: "#",
      githubUrl: "#",
      collaboration: "Team Project",
      images: [
        "./images/LTrack.png",
        "./images/leave/hr1.png",
        "./images/leave/hr2.png",
        "./images/leave/hr3.png",
        "./images/leave/hr4.png",
        "./images/leave/hr5.png",
      ],
    },
    {
      title: "LTO Licensing Queueing System Simulation",
      description:
        "A process-based model designed to represent the actual workflow of the Land Transportation Office’s licensing operations.",
      image: "./images/lto/lto.png",
      technologies: ["Python", "Pygame", "Tkinter", "Simulation"],
      liveUrl:
        "https://drive.google.com/drive/folders/1yIKmtypsRRm_3wrMNM9aqzl_G9M7LACU?usp=sharing",
      githubUrl: "https://github.com/TeruhashiN/LTO_Queueing_Simulation",
      collaboration: "Team Project",
      images: [
        "./images/lto/lto.png",
        "./images/lto/lto2.png",
        "./images/lto/lto3.png",
        "./images/lto/lto4.png",
        "./images/lto/lto5.png",
        "./images/lto/lto6.png",
      ],
    },
    {
      title: "3D Structure & Design",
      description:
        "This section presents the 3D structures developed for the driving simulation, including environment and road designs essential to the system’s functionality. It also features independent creative projects such as the Southpark-themed environment and other self-made designs, created to showcase modeling skills and environmental creativity.",
      image: "./images/design/des12.jpeg",
      technologies: ["3Ds Max", "Unreal Engine"],
      liveUrl: "#",
      githubUrl: "#",
      collaboration: "Solo Project",
      images: [
        "./images/design/des11.png",
        "./images/design/des.jpeg",
        "./images/design/des2.jpeg",
        "./images/design/des3.jpeg",
        "./images/design/des4.jpeg",
        "./images/design/des5.jpeg",
        "./images/design/des6.jpeg",
        "./images/design/des7.jpeg",
        "./images/design/des8.jpeg",
        "./images/design/des9.jpeg",
        "./images/design/des10.jpeg",
        "./images/design/des11.png",
        "./images/design/des12.jpeg",
        "./images/design/Loftia.png",
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkClick(e, project.liveUrl);
                      }}
                    >
                      Live Demo
                    </a>
                    <a
                      href={project.githubUrl}
                      className="btn btn-outline-secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkClick(e, project.githubUrl);
                      }}
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
            style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1055 }}
            onClick={handleCloseModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              style={{ maxWidth: "760px", width: "95%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg border-0">
                <div className="modal-header py-3 px-4 bg-light border-bottom">
                  <h5 className="modal-title fw-bold fs-5 text-dark mb-0">{selectedProject.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body p-3 p-md-4">
                  {/* Custom Carousel */}
                  <div
                    className="carousel slide position-relative rounded overflow-hidden border shadow-sm"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    {/* Badge / Slide Counter */}
                    <div
                      className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded text-white"
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        fontSize: "0.75rem",
                        zIndex: 10,
                      }}
                    >
                      {currentSlide + 1} / {selectedProject.images.length}
                    </div>

                    {/* Fullscreen Expand Button */}
                    <button
                      type="button"
                      className="btn btn-sm position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1 text-white border-0"
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        fontSize: "0.75rem",
                        zIndex: 10,
                        cursor: "pointer",
                      }}
                      onClick={() => setLightboxImage(selectedProject.images[currentSlide])}
                      title="View full resolution"
                    >
                      <i className="fas fa-expand"></i>
                      <span>Fullscreen</span>
                    </button>

                    {/* Carousel Inner */}
                    <div className="carousel-inner">
                      {selectedProject.images.map(
                        (img: string, imgIndex: number) => (
                          <div
                            key={imgIndex}
                            className={`carousel-item ${
                              imgIndex === currentSlide ? "active" : ""
                            }`}
                            onClick={() => setLightboxImage(img)}
                            style={{ cursor: "zoom-in" }}
                            title="Click to view full image"
                          >
                            <img
                              src={img}
                              className="d-block w-100"
                              alt={`Slide ${imgIndex + 1}`}
                              style={{
                                height: "450px",
                                objectFit: "contain",
                                objectPosition: "center",
                                padding: "4px",
                              }}
                            />
                          </div>
                        ),
                      )}
                    </div>

                    {/* Carousel Controls */}
                    {selectedProject.images.length > 1 && (
                      <>
                        <button
                          className="carousel-control-prev"
                          type="button"
                          onClick={prevSlide}
                          style={{ width: "65px" }}
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
                          style={{ width: "65px" }}
                        >
                          <span
                            className="carousel-control-next-icon"
                            aria-hidden="true"
                          ></span>
                          <span className="visually-hidden">Next</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Selector Strip */}
                  {selectedProject.images.length > 1 && (
                    <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
                      {selectedProject.images.map((thumb: string, tIdx: number) => (
                        <img
                          key={tIdx}
                          src={thumb}
                          alt={`Thumbnail ${tIdx + 1}`}
                          onClick={() => goToSlide(tIdx)}
                          className="rounded"
                          style={{
                            width: "75px",
                            height: "48px",
                            objectFit: "cover",
                            cursor: "pointer",
                            border: currentSlide === tIdx ? "2px solid #0d6efd" : "1px solid #ced4da",
                            opacity: currentSlide === tIdx ? 1 : 0.6,
                            transition: "all 0.2s ease",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p className="mt-4 fs-6 text-secondary">{selectedProject.description}</p>

                  <div className="row mt-3">
                    <div className="col-md-6 mb-3">
                      <h6 className="fw-bold text-dark">Technologies:</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {selectedProject.technologies.map(
                          (tech: string, techIndex: number) => (
                            <span
                              key={techIndex}
                              className="badge bg-secondary"
                            >
                              {tech}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <h6 className="fw-bold text-dark">Collaboration:</h6>
                      <p className="mb-0 text-muted">{selectedProject.collaboration}</p>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="mt-3 pt-3 border-top d-flex gap-2">
                    <a
                      href={selectedProject.liveUrl}
                      className="btn btn-primary px-4"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) =>
                        handleLinkClick(e, selectedProject.liveUrl)
                      }
                    >
                      <i className="fas fa-external-link-alt me-1"></i> Live Demo
                    </a>
                    <a
                      href={selectedProject.githubUrl}
                      className="btn btn-outline-secondary px-4"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) =>
                        handleLinkClick(e, selectedProject.githubUrl)
                      }
                    >
                      <i className="fab fa-github me-1"></i> GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Available Modal */}
        {showNotAvailableModal && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={handleCloseNotAvailableModal}
          >
            <div
              className="modal-dialog modal-sm"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Not Available</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseNotAvailableModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Not available for this project.</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseNotAvailableModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Lightbox Modal */}
        {lightboxImage && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              backgroundColor: "rgba(10, 15, 30, 0.95)",
              zIndex: 1065,
            }}
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="d-flex flex-column justify-content-center align-items-center h-100 p-2 p-md-4"
              style={{ position: "relative" }}
            >
              <button
                type="button"
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3 m-md-4"
                style={{ zIndex: 1070, fontSize: "1.2rem" }}
                onClick={() => setLightboxImage(null)}
                aria-label="Close"
              ></button>
              <img
                src={lightboxImage}
                alt="Enlarged project preview"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "96vw",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                  borderRadius: "8px",
                  backgroundColor: "#0f172a",
                }}
              />
              <div
                className="text-white-50 mt-2 text-center"
                style={{ fontSize: "0.75rem" }}
              >
                Click outside the image or the close button to return
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
