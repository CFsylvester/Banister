import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({}) => {
    return (
        <nav>
            <ul>
                <Link to = '/about'>
                    <li  className="primary-text">About</li>
                </Link>
                <Link to = '/services'>
                    <li  className="primary-text">Services</li>
                </Link>
                <Link to = '/news'>
                    <li  className="primary-text">News</li>
                </Link>
                <Link to = '/contact'>
                    <li  className="primary-text">Contact</li>
                </Link>
            </ul>
        </nav>
    )
};

export default Navbar; 