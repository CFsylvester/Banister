import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './sass/index.scss';
//App Components
import Navbar from './components/Navbar'; 
import Footer from './components/Footer';
//Navbar Pages
import Main from './pages/Main'; 
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import News from './pages/News'; 

const App = ({}) => {
  return (
    <div className="App">
      <p>hi</p>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Main/>} />
          <Route path="/about" element={<About/>} />
          <Route path="/services" element={<Services/>} />
          <Route path="/news" element={<News/>} />
          <Route path="/contact" element={<Contact/>} />
        </Routes>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
