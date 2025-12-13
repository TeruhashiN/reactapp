import React from "react";
import profileDP from "../assets/profileDPs.jpg";

const Header: React.FC = () => {
  return (
    <header className="text-black py-5">
      <div className="container">
        <div className="col-lg-10 mx-auto">
          <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center text-center gap-4">
            <div>
              <h1 className="display-4 fw-bold">Brylle Justin Heraldo</h1>
              <p className="lead">
                Full Stack Developer | Game Developer | 3D Artist
              </p>
            </div>

            <img src={profileDP} alt="Profile" className="small-profile" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
