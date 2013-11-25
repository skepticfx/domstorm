#### TODOs:


* Unfortunately, some APIs like XHR, doesn't throw DOM Exceptions and we need to check the request headers from a server to carry out a certain test.
* How are we going to compare the results with the specs?
* Modules_list.js must be dynamically generated across each new runs of the server, so that the modules are reloaded. For on the fly addition of modules to the system without restarting, we can call the module which does this operation.
* 
* We need a sub-domain or few to test cross-sub domain stuff.


###### Modules
* XHR Request Headers
* Security sensitive stuffs overriding.
* What cannot be overridden?
* CORS policies.
* Erland Oftedal's CSP check.
* 