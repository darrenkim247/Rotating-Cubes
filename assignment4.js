import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }
        console.log(this.shapes.box_1.arrays.texture_coord)

        this.shapes.box_2.arrays.texture_coord = this.shapes.box_2.arrays.texture_coord.map(x => x.times(2));


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png")
            }),
            stars: new Material(new Texture_Rotate(), {
                ambient: 1,
                texture: new Texture("assets/stars.png", "NEAREST")
            }),
            earth: new Material(new Texture_Scroll_X(), {
                ambient: 1,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.box_1_transform = Mat4.identity().times(Mat4.translation(-2, 0, 0, 0));
        this.box_2_transform = Mat4.identity().times(Mat4.translation(2, 0, 0, 0));

        //Added bool variable
        this.RotatingStatus = false;
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        this.key_triggered_button("Cube rotation", ["c"], () => this.RotatingStatus = !this.RotatingStatus);

    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // TODO:  Draw the required boxes. Also update their stored matrices.
        this.shapes.box_1.draw(context, program_state, this.box_1_transform, this.materials.stars);
        this.shapes.box_2.draw(context, program_state, this.box_2_transform, this.materials.earth);

        if (this.RotatingStatus) {
            // Box 1: Rotate around x-axis 
            var box_1_rotation = Math.PI/1.5 * dt;   //20rpm 
            this.box_1_transform = this.box_1_transform.times(Mat4.rotation(box_1_rotation, 1, 0, 0)); 
            // Box 2: Rotate around y-axis
            var box_2_rotation = Math.PI * dt;     //30rpm 
            this.box_2_transform = this.box_2_transform.times(Mat4.rotation(box_2_rotation, 0, 1, 0));
        }

    }
}


class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;

            void main(){
                mat4 sliding_matrix = mat4(vec4(-1., 0., 0., 0.), 
                vec4( 0., 1., 0., 0.), 
                vec4( 0., 0., 1., 0.), 
                vec4(mod(animation_time, 4.) * 2., 0., 0., 1.));

                vec4 n_tex_coord = sliding_matrix * (vec4(f_tex_coord, 0, 0) + vec4(1.0, 1.0, 0.0, 1.0)); 

                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D(texture, n_tex_coord.xy);

                //Add outline of black square on each texture

                float a = mod(n_tex_coord.x, 1.0);
                float b = mod(n_tex_coord.y, 1.0);

                float dist_to_cent = sqrt(pow(a - 0.5, 2.0) + pow(b - 0.5, 2.0)); //Calculates distance to center

                if (a > 0.15 && a < 0.25 && b > 0.15 && b < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                if (a > 0.75 && a < 0.85 && b > 0.15 && b < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                if (b > 0.15 && b < 0.25 && a > 0.15 && a < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                if (b > 0.75 && b < 0.85 && a > 0.15 && a < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }

                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                float rot_ang = 0.5*3.14159*mod(animation_time, 4.0); 
                mat4 rot_matrix = mat4(vec4(cos(rot_ang), sin(rot_ang), 0.0, 0.0), 
                                       vec4(sin(rot_ang), -cos(rot_ang), 0.0, 0.0), 
                                       vec4( 0.0, 0.0, 1.0, 0.0), 
                                       vec4( 0.0, 0.0, 0.0, 1.0));

                vec4 n_tex_coord = vec4(f_tex_coord, 0, 0) + vec4(-0.5, -0.5, 0.0, 0.0);
                n_tex_coord = (rot_matrix * n_tex_coord) + vec4(0.5, 0.5, 0., 0.); 

                vec4 tex_color = texture2D( texture, n_tex_coord.xy);

                //Add outline of black square on each texture

                float a = mod(n_tex_coord.x, 1.0);
                float b = mod(n_tex_coord.y, 1.0);

                float dist_to_cent = sqrt(pow(a - 0.5, 2.0) + pow(b - 0.5, 2.0)); //Calculates distance to center

                if (a > 0.15 && a < 0.25 && b > 0.15 && b < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                if (a > 0.75 && a < 0.85 && b > 0.15 && b < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                if (b > 0.15 && b < 0.25 && a > 0.15 && a < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                if (b > 0.75 && b < 0.85 && a > 0.15 && a < 0.85) {
                    tex_color = vec4(0, 0, 0, 1.0);
                }
                
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

