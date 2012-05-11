Python Unittests
================

| Assure that the user is logged in
| There is no way of mocking the user servise
| As the system that google app engine provides does not work

| activates the testbed (Used for creating face DB and blobstore)
| Swaps the fake systems in for the real systems
| Should make this only work offline
| Initializes the fake blobstore and datastore

Main Page Unit
--------------

| Unit test for MainPage (MainPage_test1)
| Checks to assure that the main page can load

| Unit test for MainPage (MainPage_test3)
| Checks to assure that the page has a section "wall"	

| Unit test for MainPage (MainPage_test4)
| Checks to assure that the page has the directional scrolling divs
    
| Unit test for MainPage (MainPage_test2)
| Checks to assure that the page has the specified sections


Get Tile Unit Testing
---------------------

| Creating fake tile to test tile reading

| Unit test for get tile (GetTile_test1)
| Checks to assure that the file can load at all           	

| Unit test for get tile (GetTile_test2)
| Checks to assure that the file can load correctly
            
| Unit test for get tile (GetTile_test3)
| Checks to assure that the mach in test 1 is not erroneous

| Unit test for get tile (GetTile_test4)
| Checks to assure that a tile that does not
| exist in the database does not load

Save Tile Unit Testing
----------------------

| Reinitializes the fake blobstore and datastore for the next test
| We can't actualy create an object in the test bed Datastore
| The perameters to create a blob at x=0,y=0
| Test if there is even a responce from /save 
| test to see if the created tile actualy exists

User Tile Claim Number Unit Testing
-----------------------------------

| Reinitializes the fake blobstore and datastore for the next test
| Check if the system can handle a user who has not been entered yet
| Reinitializes the fake datastore for the next test
| Assure data about users is retrieved correctly
| Check if the correct number of tiles information was contianed in the resoponce

Create Claim Unit Testing
-------------------------

| Reinitializes the fake blobstore and datastore for the next test
| Check if the system can store Claim

Inform Claim Owner Unit Testing
-------------------------------

| Reinitializes the fake blobstore and datastore for the next test
| For this test we need to check if we are sending mail.
| Create a fake user with 1 tile claimed

Remove Claim Unit Testing
-------------------------

| Reinitializes the fake blobstore and datastore for the next test
| Create a fake user with 1 tile claimed
| Checks if the system can remove Claim

Tile Claimed By User Unit Testing
---------------------------------

| Reinitializes the fake blobstore and datastore for the next test
| Create a fake user with 1 tile claimed
| Swaps the real systems back in,
| and deactivates the fake testing system.
