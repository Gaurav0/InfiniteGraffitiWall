Python Unittests
================

activates the testbed (Used for creating face DB and blobstore)
Swaps the fake systems in for the real systems
Should make this only work offline
Initializes the fake blobstore and datastore

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
| Swaps the real systems back in,
| and deactivates the fake testing system.
