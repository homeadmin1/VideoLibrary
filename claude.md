# Web Video Library

## Summary

This project is about a video library that use dynamically the folder and subfolder structures to generate an HTML that show the videos.
User can preview each video by hovering the mouse on each video.
All videos are tagged and categorized, mainly using the name of the folder and subfolder where the videos are physically located.
Modern web design let the user search by many properties of the metadata for the videos.
Each video has tools to view en full screen, download on local drive and everything operation that can be done in a video library on line.
Also the user can give a like to the video and add to favorites.
A vertical view tree of the category in the main site allow user see all videos related with that particular category.
At the end of the vertical menu at the left, must be a cloud of words with the tags already set in each video, giving the change to the user that selecting a tag in the cloud of words bring all videos associated.
The main site also has a place/section where host the references of all videos that the user set as a favorite, giving the possibility to the user to administer their favorites videos.
There is an administration site to manage all videos, like modifying the metadata, change the name, write a description, etc. All this data is serve in a way that the user can search them in the main library.
In the Tags section of the editing of the video, the user can use special character '#' to list already existing tags that autocomplete while writing a word. That way, minimize the typo error when tagging videos.
Also in the administration site there will be insight reports to show several KPIs for all the videos in the library.
The site is using modern web design, oriented to a video library online, using free components to manage and view the video itself and the libraries.
All videos, with the folder and subfolder, will be located on "video-library" folder from the root of the project.

## Technologies

React + TypeScript (via Vite) - Frontend
Node.js for backend - Backend
Postgres 17 - Data support
Docker solution - Host support

## Structure

Modern web library site with search components as a highlighted component in order to user can lookup the complete library.
Also there are filters to support the search, which the most important is the categories, presented in dynamic combos representing the folder and subfolder of each videos.
The videos are presented in a grid mode, with a modern and responsive design. The user can preview the video as he over the mouse on it. Clicking the video can show it in full screen and present the metadata associated to the video.
An special administration site allow to administer the videos, like editing each video metadata to enrich the search experience in the main site.
Several reports for insight will also inside the administration site. Most played, total videos in the library, tree view of the categories, and more to enrich the experience to understand what video content are on the libraries.

## Hosting Solution

The project will be hosted using Docker solution, with a docker-compose file to run the complete solution in a single command.
The video library will be a reference as a volume in the docker-compose to point the "video-library" physical folder at the root of the project.
