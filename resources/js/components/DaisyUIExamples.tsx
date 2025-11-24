/**
 * DaisyUI Components Integration Example
 * 
 * This file demonstrates how to use DaisyUI components in your project.
 * DaisyUI is now configured and ready to use throughout the application.
 * 
 * Usage Examples:
 */

// Button Examples
export const ButtonExamples = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">DaisyUI Buttons</h3>
      <div className="flex gap-2 flex-wrap">
        <button className="btn">Default</button>
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-accent">Accent</button>
        <button className="btn btn-ghost">Ghost</button>
        <button className="btn btn-link">Link</button>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-info">Info</button>
        <button className="btn btn-success">Success</button>
        <button className="btn btn-warning">Warning</button>
        <button className="btn btn-error">Error</button>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-sm">Small</button>
        <button className="btn">Normal</button>
        <button className="btn btn-lg">Large</button>
      </div>
    </div>
  );
};

// Card Examples
export const CardExamples = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">DaisyUI Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow-xl">
          <figure><img src="https://placehold.co/400x200" alt="Product" /></figure>
          <div className="card-body">
            <h2 className="card-title">Card with Image</h2>
            <p>This is a beautiful card component from DaisyUI</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Buy Now</button>
            </div>
          </div>
        </div>

        <div className="card bg-primary text-primary-content">
          <div className="card-body">
            <h2 className="card-title">Colored Card</h2>
            <p>Cards can have different colors and styles</p>
            <div className="card-actions justify-end">
              <button className="btn">Action</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Badge Examples
export const BadgeExamples = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">DaisyUI Badges</h3>
      <div className="flex gap-2 flex-wrap">
        <div className="badge">neutral</div>
        <div className="badge badge-primary">primary</div>
        <div className="badge badge-secondary">secondary</div>
        <div className="badge badge-accent">accent</div>
        <div className="badge badge-ghost">ghost</div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <div className="badge badge-info">info</div>
        <div className="badge badge-success">success</div>
        <div className="badge badge-warning">warning</div>
        <div className="badge badge-error">error</div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <div className="badge badge-lg">Large</div>
        <div className="badge badge-md">Medium</div>
        <div className="badge badge-sm">Small</div>
        <div className="badge badge-xs">Tiny</div>
      </div>
    </div>
  );
};

// Alert Examples
export const AlertExamples = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">DaisyUI Alerts</h3>
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Info: This is an information alert</span>
      </div>
      
      <div className="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Success: Your purchase has been confirmed!</span>
      </div>
      
      <div className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>Warning: Invalid email address!</span>
      </div>
      
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Error: Your session has expired</span>
      </div>
    </div>
  );
};

// Modal Example
export const ModalExample = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">DaisyUI Modal</h3>
      
      <button className="btn" onClick={() => (document.getElementById('my_modal_1') as HTMLDialogElement)?.showModal()}>
        Open Modal
      </button>
      
      <dialog id="my_modal_1" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hello!</h3>
          <p className="py-4">Press ESC key or click the button below to close</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

// Loading Examples
export const LoadingExamples = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">DaisyUI Loading Spinners</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <span className="loading loading-spinner loading-xs"></span>
        <span className="loading loading-spinner loading-sm"></span>
        <span className="loading loading-spinner loading-md"></span>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
      
      <div className="flex gap-4 flex-wrap items-center">
        <span className="loading loading-dots loading-xs"></span>
        <span className="loading loading-dots loading-sm"></span>
        <span className="loading loading-dots loading-md"></span>
        <span className="loading loading-dots loading-lg"></span>
      </div>
      
      <div className="flex gap-4 flex-wrap items-center">
        <span className="loading loading-ring loading-xs"></span>
        <span className="loading loading-ring loading-sm"></span>
        <span className="loading loading-ring loading-md"></span>
        <span className="loading loading-ring loading-lg"></span>
      </div>
    </div>
  );
};

// How to use in your components:
/*

import { ButtonExamples, CardExamples } from '@/components/DaisyUIExamples';

function MyComponent() {
  return (
    <div>
      <ButtonExamples />
      <CardExamples />
    </div>
  );
}

*/
