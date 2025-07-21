# A "third-party" site that serves files and set cookies 

This is the "third-party" site used by the demo at [3pc.glitch.me](https://3pc.glitch.me). 

`Set-Cookie` headers are included in response to requests for `images/kittens.jpg` and `index.html` on this site. 

A `SameSite=None` attribute is included in the `Set-Cookie` header for `index.html`. This means the cookie set in the header will be included in response to cross-site requests. 

No `SameSite` attribute is set for `images/kittens.jpg`, so the default `SameSite=Lax` will be applied. The `Lax` default value blocks cross-site cookies except in response to following a link to a web page, so cross-site requests for this image will not include the cookie.

See [server.js](https://glitch.com/edit/#!/3p-site?path=server.js%3A9%3A8) for the Node code that sets the cookies.

## Comments and suggestions

If you find bugs with this demo or would like to suggest changes, please message [@sw12](https//twitter.com/sw12).

## Find out more

* [Third-party cookie demo](https://3pc.glitch.me)
* [First-party cookie demo](https://1pc.glitch.me)
* [What are cookies?](https://goo.gle/cookies)
* [What are third-party cookies?](https://goo.gle/3pc)
* [What's wrong with third-party cookies?](https://goo.gle/3pc-what)

## License

Copyright 2025 Google, Inc.

Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements. See the NOTICE file distributed with this work for additional information regarding copyright ownership. The ASF licenses this file to you under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Please note: this is not a Google product.
