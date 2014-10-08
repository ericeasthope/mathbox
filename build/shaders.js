window.MathBox.Shaders = {"arrow.position": "uniform float arrowSize;\nuniform float arrowSpace;\n\nattribute vec4 position4;\nattribute vec3 arrow;\nattribute vec2 attach;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvoid getArrowGeometry(vec4 xyzw, float near, float far, out vec3 left, out vec3 right, out vec3 start) {\n  right = getPosition(xyzw);\n  left  = getPosition(vec4(near, xyzw.yzw));\n  start = getPosition(vec4(far, xyzw.yzw));\n}\n\nmat4 getArrowMatrix(float size, vec3 left, vec3 right, vec3 start) {\n  \n  vec3 diff = left - right;\n  float l = length(diff);\n  if (l == 0.0) {\n    return mat4(1.0, 0.0, 0.0, 0.0,\n                0.0, 1.0, 0.0, 0.0,\n                0.0, 0.0, 1.0, 0.0,\n                0.0, 0.0, 0.0, 1.0);\n  }\n\n  // Construct TBN matrix around shaft\n  vec3 t = normalize(diff);\n  vec3 n = normalize(cross(t, t.yzx + vec3(.1, .2, .3)));\n  vec3 b = cross(n, t);\n  \n  // Shrink arrows when vector gets too small\n  // Approach linear scaling with cubic ease the smaller we get\n  diff = right - start;\n  l = length(diff) * arrowSpace;\n  float mini = clamp((3.0 - l / size) * .333, 0.0, 1.0);\n  float scale = 1.0 - mini * mini * mini;\n  \n  // Size to 2.5:1 ratio\n  size *= scale;\n  float sizeNB = size / 2.5;\n\n  // Anchor at end position\n  return mat4(vec4(n * sizeNB,  0),\n              vec4(b * sizeNB,  0),\n              vec4(t * size, 0),\n              vec4(right,  1.0));\n}\n\nvec3 getArrowPosition() {\n  vec3 left, right, start;\n  \n  getArrowGeometry(position4, attach.x, attach.y, left, right, start);\n  mat4 matrix = getArrowMatrix(arrowSize, left, right, start);\n  return (matrix * vec4(arrow.xyz, 1.0)).xyz;\n\n}\n",
"axis.position": "uniform vec4 axisStep;\nuniform vec4 axisPosition;\n\nvec4 getAxisPosition(vec4 xyzw) {\n  return axisStep * xyzw.x + axisPosition;\n}\n",
"cartesian.position": "uniform mat4 viewMatrix;\n\nvec4 getCartesianPosition(vec4 position) {\n  return viewMatrix * vec4(position.xyz, 1.0);\n}\n",
"cartesian4.position": "uniform vec4 basisScale;\nuniform vec4 basisOffset;\nuniform mat4 viewMatrix;\nuniform vec2 view4D;\n\nvec4 getCartesian4Position(vec4 position) {\n  vec4 pos4 = position * basisScale - basisOffset;\n  vec3 xyz = (viewMatrix * vec4(pos4.xyz, 1.0)).xyz;\n  return vec4(xyz, pos4.w * view4D.y + view4D.x);\n}\n",
"color.opaque": "vec4 opaqueColor(vec4 color) {\n  return vec4(color.rgb, 1.0);\n}\n",
"face.position.normal": "attribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvoid getFaceGeometry(vec4 xyzw, out vec3 pos, out vec3 normal) {\n  vec3 a, b, c;\n\n  a   = getPosition(vec4(xyzw.xyz, 0.0));\n  b   = getPosition(vec4(xyzw.xyz, 1.0));\n  c   = getPosition(vec4(xyzw.xyz, 2.0));\n\n  pos = getPosition(xyzw);\n  normal = normalize(cross(c - a, b - a));\n}\n\nvec3 getFacePositionNormal() {\n  vec3 center, normal;\n\n  getFaceGeometry(position4, center, normal);\n  vNormal   = normal;\n  vLight    = normalize((viewMatrix * vec4(1.0, 2.0, 2.0, 0.0)).xyz);\n  vPosition = -center;\n\n  return center;\n}\n",
"fragment.clipEnds": "varying vec2 vClipEnds;\n\nvoid clipEndsFragment() {\n  if (vClipEnds.x < 0.0 || vClipEnds.y < 0.0) discard;\n}\n",
"fragment.color": "void setFragmentColor(vec4 color) {\n  gl_FragColor = color;\n}",
"grid.position": "uniform vec4 gridPosition;\nuniform vec4 gridStep;\nuniform vec4 gridAxis;\n\nvec4 sampleData(vec2 xy);\n\nvec4 getGridPosition(vec4 xyzw) {\n  vec4 onAxis  = gridAxis * sampleData(vec2(xyzw.y, 0.0)).x;\n  vec4 offAxis = gridStep * xyzw.x + gridPosition;\n  return onAxis + offAxis;\n}\n",
"join.position": "uniform float joinStride;\nuniform float joinStrideInv;\n\nfloat getIndex(vec4 xyzw);\nvec4 getRest(vec4 xyzw);\nvec4 injectIndices(float a, float b);\n\nvec4 getJoinXYZW(vec4 xyzw) {\n\n  float a = getIndex(xyzw);\n  float b = a * joinStrideInv;\n\n  float integer  = floor(b);\n  float fraction = b - integer;\n  \n  return injectIndices(fraction * joinStride, integer) + getRest(xyzw);\n}\n",
"lerp.depth": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpDepth(vec4 xyzw) {\n  float x = xyzw.z * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(xyzw.xy, i, xyzw.w);\n  vec4 xyzw2 = vec4(xyzw.xy, i + 1.0, xyzw.w);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"lerp.height": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpHeight(vec4 xyzw) {\n  float x = xyzw.y * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(xyzw.x, i, xyzw.zw);\n  vec4 xyzw2 = vec4(xyzw.x, i + 1.0, xyzw.zw);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"lerp.items": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpItems(vec4 xyzw) {\n  float x = xyzw.w * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(xyzw.xyz, i);\n  vec4 xyzw2 = vec4(xyzw.xyz, i + 1.0);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"lerp.width": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpWidth(vec4 xyzw) {\n  float x = xyzw.x * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(i, xyzw.yzw);\n  vec4 xyzw2 = vec4(i + 1.0, xyzw.yzw);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"line.clipEnds": "uniform float clipRange;\nuniform vec2  clipStyle;\nuniform float clipSpace;\nuniform float lineWidth;\n\nattribute vec2 strip;\n//attribute vec2 position4;\n\nvarying vec2 vClipEnds;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvoid clipEndsPosition(vec3 pos) {\n\n  // Sample end of line strip\n  vec4 xyzwE = vec4(strip.y, position4.yzw);\n  vec3 end   = getPosition(xyzwE);\n\n  // Sample start of line strip\n  vec4 xyzwS = vec4(strip.x, position4.yzw);\n  vec3 start = getPosition(xyzwS);\n\n  // Measure length and adjust clip range\n  // Approach linear scaling with cubic ease the smaller we get\n  vec3 diff = end - start;\n  float l = length(vec2(length(diff), lineWidth)) * clipSpace;\n  float mini = clamp((3.0 - l / clipRange) * .333, 0.0, 1.0);\n  float scale = 1.0 - mini * mini * mini; \n  float range = clipRange * scale;\n  \n  vClipEnds = vec2(1.0);\n  \n  if (clipStyle.y > 0.0) {\n    // Clip end\n    float d = length(pos - end);\n    vClipEnds.x = d / range - 1.0;\n  }\n\n  if (clipStyle.x > 0.0) {\n    // Clip start \n    float d = length(pos - start);\n    vClipEnds.y = d / range - 1.0;\n  }\n}",
"line.position": "uniform float lineWidth;\nuniform float lineDepth;\nuniform vec4 geometryClip;\n\nattribute vec2 line;\nattribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvoid getLineGeometry(vec4 xyzw, float edge, out vec3 left, out vec3 center, out vec3 right) {\n  vec4 delta = vec4(1.0, 0.0, 0.0, 0.0);\n\n  center =                 getPosition(xyzw);\n  left   = (edge > -0.5) ? getPosition(xyzw - delta) : center;\n  right  = (edge < 0.5)  ? getPosition(xyzw + delta) : center;\n}\n\nvec3 getLineJoin(float edge, vec3 left, vec3 center, vec3 right) {\n  vec2 join = vec2(1.0, 0.0);\n\n  if (center.z < 0.0) {\n    vec4 a = vec4(left.xy, right.xy);\n    vec4 b = a / vec4(left.zz, right.zz);\n\n    vec2 l = b.xy;\n    vec2 r = b.zw;\n    vec2 c = center.xy / center.z;\n\n    vec4 d = vec4(l, c) - vec4(c, r);\n    float l1 = dot(d.xy, d.xy);\n    float l2 = dot(d.zw, d.zw);\n\n    if (l1 + l2 > 0.0) {\n      \n      if (edge > 0.5 || l2 == 0.0) {\n        vec2 nl = normalize(l - c);\n        vec2 tl = vec2(nl.y, -nl.x);\n\n        join = tl;\n      }\n      else if (edge < -0.5 || l1 == 0.0) {\n        vec2 nr = normalize(c - r);\n        vec2 tr = vec2(nr.y, -nr.x);\n\n        join = tr;\n      }\n      else {\n        vec2 nl = normalize(d.xy);\n        vec2 nr = normalize(d.zw);\n\n        vec2 tl = vec2(nl.y, -nl.x);\n        vec2 tr = vec2(nr.y, -nr.x);\n\n        vec2 tc = normalize(tl + tr);\n      \n        float cosA = dot(nl, tc);\n        float sinA = max(0.1, abs(dot(tl, tc)));\n        float factor = cosA / sinA;\n        float scale = sqrt(1.0 + factor * factor);\n\n        join = tc * scale;\n      }\n    }\n    else {\n      return vec3(0.0);\n    }\n  }\n    \n  return vec3(join, 0.0);\n}\n\nvec3 getLinePosition() {\n  vec3 left, center, right, join;\n\n  float edge = line.x;\n  float offset = line.y;\n\n  vec4 p = min(geometryClip, position4);\n  getLineGeometry(p, edge, left, center, right);\n  join = getLineJoin(edge, left, center, right);\n  \n  float width = lineWidth;\n  if (lineDepth < 1.0) {\n    width /= mix(1.0/max(0.001, -center.z), 1.0, lineDepth);\n  }\n  \n  return center + join * offset * width;\n}\n",
"map.2d.data": "uniform vec2 dataResolution;\nuniform vec2 dataPointer;\n\nvec2 map2DData(vec2 xy) {\n  return fract((xy + dataPointer) * dataResolution);\n}\n",
"map.xyzw.2dv": "void mapXyzw2DV(vec4 xyzw, out vec2 xy, out float z) {\n  xy = xyzw.xy;\n  z  = xyzw.z;\n}\n\n",
"map.xyzw.texture": "uniform float textureItems;\nuniform float textureHeight;\n\nvec2 mapXyzwTexture(vec4 xyzw) {\n  \n  float x = xyzw.x;\n  float y = xyzw.y;\n  float z = xyzw.z;\n  float i = xyzw.w;\n  \n  return vec2(i + x * textureItems, y + z * textureHeight);\n}\n\n",
"mesh.fragment.color": "varying vec4 vColor;\n\nvec4 getColor(vec4 rgba) {\n  return rgba * vColor;\n}\n",
"mesh.position": "attribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvec3 getMeshPosition() {\n  return getPosition(position4);\n}\n",
"mesh.vertex.color": "attribute vec4 position4;\nvarying vec4 vColor;\n\n// External\nvec4 getSample(vec4 xyzw);\n\nvoid vertexColor() {\n  vColor = getSample(position4);\n}\n",
"object.position": "uniform mat4 objectMatrix;\n\nvec4 getObjectPosition(vec4 position) {\n  return objectMatrix * vec4(position.xyz, 1.0);\n}\n",
"object4.position": "uniform mat4 objectMatrix;\nuniform vec2 object4D;\n\nvec4 getObject4Position(vec4 position) {\n  vec3 xyz = (objectMatrix * vec4(position.xyz, 1.0)).xyz;\n  return vec4(xyz, position.w * object4D.y + object4D.x);\n}\n",
"polar.position": "uniform float polarBend;\nuniform float polarFocus;\nuniform float polarAspect;\nuniform float polarHelix;\n\nuniform mat4 viewMatrix;\n\nvec4 getPolarPosition(vec4 position) {\n  if (polarBend > 0.0001) {\n\n    vec2 xy = position.xy * vec2(polarBend, polarAspect);\n    float radius = polarFocus + xy.y;\n\n    return viewMatrix * vec4(\n      sin(xy.x) * radius,\n      (cos(xy.x) * radius - polarFocus) / polarAspect,\n      position.z + position.x * polarHelix * polarBend,\n      1.0\n    );\n  }\n  else {\n    return viewMatrix * vec4(position.xyz, 1.0);\n  }\n}",
"project.position": "uniform float styleZIndex;\n\nvoid setPosition(vec3 position) {\n  vec4 pos = projectionMatrix * vec4(position, 1.0);\n  pos.z *= (1.0 - styleZIndex / 32768.0);\n  gl_Position = pos;\n}\n",
"project4.position": "uniform mat4 projectionMatrix;\n\nvec4 getProject4Position(vec4 position) {\n  vec3 pos3 = (projectionMatrix * position).xyz;\n  return vec4(pos3, 1.0);\n}\n",
"raw.position.scale": "uniform vec4 geometryScale;\nattribute vec4 position4;\n\nvec4 getRawPositionScale() {\n  return geometryScale * position4;\n}\n",
"repeat.position": "uniform vec4 repeatModulus;\n\nvec4 getRepeatXYZW(vec4 xyzw) {\n  return mod(xyzw, repeatModulus);\n}\n",
"sample.2d": "uniform sampler2D dataTexture;\n\nvec4 sample2D(vec2 uv) {\n  return texture2D(dataTexture, uv);\n}\n",
"screen.position": "void setScreenPosition(vec4 position) {\n  gl_Position = vec4(position.xy * 2.0 - 1.0, 0.5, 1.0);\n}\n",
"screen.remap.2d.xyzw": "uniform vec2 remap2DScale;\n\nvec4 screenRemap2Dxyzw(vec2 uv) {\n  return vec4(remap2DScale * uv - vec2(.5), 0.0, 0.0);\n}\n",
"screen.remap.4d.xyzw": "uniform vec2 remap2DScale;\nuniform vec2 remapModulus;\nuniform vec2 remapModulusInv;\n\nvec4 screenRemap4Dxyzw(vec2 uv) {\n  vec2 st = remap2DScale * uv - .5;\n  vec2 xy = st * remapModulusInv;\n  vec2 ixy = floor(xy);\n  vec2 fxy = xy - ixy;\n  vec2 zw = fxy * remapModulus;\n  return vec4(ixy.x, zw.y, ixy.y, zw.x);\n}\n",
"spherical.position": "uniform float sphericalBend;\nuniform float sphericalFocus;\nuniform float sphericalAspectX;\nuniform float sphericalAspectY;\nuniform float sphericalScaleY;\n\nuniform mat4 viewMatrix;\n\nvec4 getSphericalPosition(vec4 position) {\n  if (sphericalBend > 0.0001) {\n\n    vec3 xyz = position.xyz * vec3(sphericalBend, sphericalBend / sphericalAspectY * sphericalScaleY, sphericalAspectX);\n    float radius = sphericalFocus + xyz.z;\n    float cosine = cos(xyz.y) * radius;\n\n    return viewMatrix * vec4(\n      sin(xyz.x) * cosine,\n      sin(xyz.y) * radius * sphericalAspectY,\n      (cos(xyz.x) * cosine - sphericalFocus) / sphericalAspectX,\n      1.0\n    );\n  }\n  else {\n    return viewMatrix * vec4(position.xyz, 1.0);\n  }\n}",
"split.position": "uniform float splitStride;\n\nvec2 getIndices(vec4 xyzw);\nvec4 getRest(vec4 xyzw);\nvec4 injectIndex(float v);\n\nvec4 getSplitXYZW(vec4 xyzw) {\n  vec2 uv = getIndices(xyzw);\n  float offset = uv.x + uv.y * splitStride;\n  return injectIndex(offset) + getRest(xyzw);\n}\n",
"spread.position": "uniform vec4 spreadOffset;\nuniform mat4 spreadMatrix;\n\n// External\nvec4 getValue(vec4 xyzw);\n\nvec4 getSpreadValue(vec4 xyzw) {\n  vec4 sample = getValue(xyzw);\n  return sample + spreadMatrix * (spreadOffset + xyzw);\n}\n",
"sprite.alpha.circle": "varying float vPixelSize;\n\nfloat getCircleAlpha(float mask) {\n  // Approximation: 1 - x*x is approximately linear around x = 1 with slope 2\n  return vPixelSize * (1.0 - mask);\n  //  return vPixelSize * 0.5 * (1.0 - sqrt(mask));\n}\n",
"sprite.edge": "varying vec2 vSprite;\n\nfloat getSpriteMask(vec2 xy);\nfloat getSpriteAlpha(float mask);\n\nvoid setFragmentColorFill(vec4 color) {\n  float mask = getSpriteMask(vSprite);\n  if (mask > 1.0) {\n    discard;\n  }\n  float alpha = getSpriteAlpha(mask);\n  if (alpha >= 1.0) {\n    discard;\n  }\n  gl_FragColor = vec4(color.rgb, alpha * color.a);\n}\n",
"sprite.fill": "varying vec2 vSprite;\n\nfloat getSpriteMask(vec2 xy);\nfloat getSpriteAlpha(float mask);\n\nvoid setFragmentColorFill(vec4 color) {\n  float mask = getSpriteMask(vSprite);\n  if (mask > 1.0) {\n    discard;\n  }\n  float alpha = getSpriteAlpha(mask);\n  if (alpha < 1.0) {\n    discard;\n  }\n  gl_FragColor = color;\n}\n\n",
"sprite.mask.circle": "varying float vPixelSize;\n\nfloat getCircleMask(vec2 uv) {\n  return dot(uv, uv);\n}\n",
"sprite.position": "uniform float pointSize;\nuniform float renderScale;\n\nattribute vec4 position4;\nattribute vec2 sprite;\n\nvarying vec2 vSprite;\nvarying float vPixelSize;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvec3 getPointPosition() {\n  vec3 center = getPosition(position4);\n\n  float pixelSize = renderScale * pointSize / -center.z;\n  float paddedSize = pixelSize + 0.5;\n  float padFactor = paddedSize / pixelSize;\n\n  vPixelSize = paddedSize;\n  vSprite    = sprite;\n\n  return center + vec3(sprite * pointSize * padFactor, 0.0);\n}\n",
"stereographic.position": "uniform float stereoBend;\n\nuniform mat4 viewMatrix;\n\nvec4 getStereoPosition(vec4 position) {\n  if (stereoBend > 0.0001) {\n\n    vec3 pos = position.xyz;\n    float r = length(pos);\n    float z = r + pos.z;\n    vec3 project = vec3(pos.xy / z, r);\n    \n    vec3 lerped = mix(pos, project, stereoBend);\n\n    return viewMatrix * vec4(lerped, 1.0);\n  }\n  else {\n    return viewMatrix * vec4(position.xyz, 1.0);\n  }\n}",
"stereographic4.position": "uniform float stereoBend;\nuniform vec4 basisScale;\nuniform vec4 basisOffset;\nuniform mat4 viewMatrix;\nuniform vec2 view4D;\n\nvec4 getStereographic4Position(vec4 position) {\n  \n  vec4 transformed;\n  if (stereoBend > 0.0001) {\n\n    float r = length(position);\n    float w = r + position.w;\n    vec4 project = vec4(position.xyz / w, r);\n    \n    transformed = mix(position, project, stereoBend);\n  }\n  else {\n    transformed = position;\n  }\n\n  vec4 pos4 = transformed * basisScale - basisOffset;\n  vec3 xyz = (viewMatrix * vec4(pos4.xyz, 1.0)).xyz;\n  return vec4(xyz, pos4.w * view4D.y + view4D.x);\n}\n",
"stpq.sample.2d": "varying vec2 vST;\n\nvec4 getSample(vec2 st);\n\nvec4 getSTSample() {\n  return getSample(vST);\n}\n",
"stpq.xyzw.2d": "varying vec2 vST;\n\nvoid setRawST(vec4 xyzw) {\n  vST = xyzw.xy;\n}\n",
"strip.position.normal": "attribute vec4 position4;\nattribute vec3 strip;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvoid getStripGeometry(vec4 xyzw, vec3 strip, out vec3 pos, out vec3 normal) {\n  vec3 a, b, c;\n\n  a   = getPosition(xyzw);\n  b   = getPosition(vec4(xyzw.xyz, strip.x));\n  c   = getPosition(vec4(xyzw.xyz, strip.y));\n\n  pos = getPosition(xyzw);\n  normal = normalize(cross(c - a, b - a)) * strip.z;\n}\n\nvec3 getStripPositionNormal() {\n  vec3 center, normal;\n\n  getStripGeometry(position4, strip, center, normal);\n  vNormal   = normal;\n  vLight    = normalize((viewMatrix * vec4(1.0, 2.0, 2.0, 0.0)).xyz);\n  vPosition = -center;\n\n  return center;\n}\n",
"style.color": "uniform vec3 styleColor;\nuniform float styleOpacity;\n\nvec4 getStyleColor() {\n  return vec4(styleColor, styleOpacity);\n}\n",
"style.color.shaded": "uniform vec3 styleColor;\nuniform float styleOpacity;\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvec4 getStyleColor() {\n  \n  vec3 color = styleColor * styleColor;\n  vec3 color2 = styleColor;\n\n  vec3 normal = normalize(vNormal);\n  vec3 light = normalize(vLight);\n  vec3 position = normalize(vPosition);\n  \n  float side    = gl_FrontFacing ? -1.0 : 1.0;\n  float cosine  = side * dot(normal, light);\n  float diffuse = mix(max(0.0, cosine), .5 + .5 * cosine, .1);\n  \n  vec3  halfLight = normalize(light + position);\n\tfloat cosineHalf = max(0.0, side * dot(normal, halfLight));\n\tfloat specular = pow(cosineHalf, 16.0);\n\t\n\treturn vec4(sqrt(color * (diffuse * .9 + .05) + .25 * color2 * specular), styleOpacity);\n}\n",
"surface.position": "attribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvec3 getSurfacePosition() {\n  return getPosition(position4);\n}\n",
"surface.position.normal": "attribute vec4 position4;\nattribute vec2 surface;\n\n// External\nvec3 getPosition(vec4 xyzw);\n\nvoid getSurfaceGeometry(vec4 xyzw, float edgeX, float edgeY, out vec3 left, out vec3 center, out vec3 right, out vec3 up, out vec3 down) {\n  vec4 deltaX = vec4(1.0, 0.0, 0.0, 0.0);\n  vec4 deltaY = vec4(0.0, 1.0, 0.0, 0.0);\n\n  /*\n  // high quality, 5 tap\n  center =                  getPosition(xyzw);\n  left   = (edgeX > -0.5) ? getPosition(xyzw - deltaX) : center;\n  right  = (edgeX < 0.5)  ? getPosition(xyzw + deltaX) : center;\n  down   = (edgeY > -0.5) ? getPosition(xyzw - deltaY) : center;\n  up     = (edgeY < 0.5)  ? getPosition(xyzw + deltaY) : center;\n  */\n  \n  // low quality, 3 tap\n  center =                  getPosition(xyzw);\n  left   =                  center;\n  down   =                  center;\n  right  = (edgeX < 0.5)  ? getPosition(xyzw + deltaX) : (2.0 * center - getPosition(xyzw - deltaX));\n  up     = (edgeY < 0.5)  ? getPosition(xyzw + deltaY) : (2.0 * center - getPosition(xyzw - deltaY));\n}\n\nvec3 getSurfaceNormal(vec3 left, vec3 center, vec3 right, vec3 up, vec3 down) {\n  vec3 dx = right - left;\n  vec3 dy = up    - down;\n  vec3 n = cross(dy, dx);\n  if (length(n) > 0.0) {\n    return normalize(n);\n  }\n  return vec3(0.0, 1.0, 0.0);\n}\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvec3 getSurfacePositionNormal() {\n  vec3 left, center, right, up, down;\n\n  getSurfaceGeometry(position4, surface.x, surface.y, left, center, right, up, down);\n  vNormal   = getSurfaceNormal(left, center, right, up, down);\n  vLight    = normalize((viewMatrix * vec4(1.0, 2.0, 2.0, 0.0)).xyz);// - center);\n  vPosition = -center;\n  \n  return center;\n}\n",
"ticks.position": "uniform float tickSize;\nuniform vec4  tickAxis;\nuniform vec4  tickNormal;\n\nvec4 sampleData(vec2 xy);\n\nvec3 transformPosition(vec4 value);\n\nvec3 getTickPosition(vec4 xyzw) {\n\n  const float epsilon = 0.0001;\n  float line = xyzw.x - .5;\n\n  vec4 center = tickAxis * sampleData(vec2(xyzw.y, 0.0));\n  vec4 edge   = tickNormal * epsilon;\n\n  vec4 a = center;\n  vec4 b = center + edge;\n\n  vec3 c = transformPosition(a);\n  vec3 d = transformPosition(b);\n  \n  vec3 mid  = c;\n  vec3 side = normalize(d - c);\n\n  return mid + side * line * tickSize;\n}\n",
"view.position": "vec3 getViewPosition(vec4 position) {\n  return (viewMatrix * vec4(position.xyz, 1.0)).xyz;\n}"};
