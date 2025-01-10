const Handlebars = require('handlebars');
const moment = require('moment');
const {ObjectId}=require('mongodb')

Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
  });
  
  
  Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
  });
  
  
  Handlebars.registerHelper("for", function (from, to, incr, block) {
    let accum = "";
    for (let i = from; i <= to; i += incr) {
      accum += block.fn(i);
    }
    return accum;
  
  })
  
  
  Handlebars.registerHelper('ifCond', function(v1, v2, options) {
    if (v1 === v2) {
      return options.fn ? options.fn(this) : options.fn;
    } else {
      return options.inverse ? options.inverse(this) : options.inverse
    }
  })
  

  Handlebars.registerHelper('multiply', function(a, b) {
    return a * b;
  });
  Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
  });
  
  
  Handlebars.registerHelper('add', function (a, b) {
    return a+b
  });
  
  Handlebars.registerHelper('increment', function(index) {
    return index + 1;
  });
  
  // Define a Handlebars helper
  Handlebars.registerHelper('ifFirst', function(index, options) {
    if (index === 0) {
        return options.fn(this); // Return content inside the block
    } else {
        return options.inverse(this); // Return if not first
    }
  });
  
  
  Handlebars.registerHelper('formatDate', function (timestamp) {
    return moment(timestamp).format(' D,MMMM, YYYY');
  });
  Handlebars.registerHelper('formatTime', function (timestamp) {
    return moment(timestamp).format(' h:mm A');
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
  
  // Handlebars.registerHelper('singlestatuchecker', function (product, options) {
  //   if (product.isReturned) {
  //     return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Returned</span>');
  //   } else if (product.isCancelled) {
  //     return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Cancelled</span>');
  //   } else {
  //     return options.fn(this);
  //   }
  // });

//   Handlebars.registerHelper('singlestatuchecker', function (product, options) {
//     // Check if the product has been returned
//     if (product.isReturned) {
//         return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Returned</span>');
//     } 
//     // Check if the product has been canceled
//     else if (product.isCancelled) {
//         return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Cancelled</span>');
//     } 
//     // If neither condition is true, allow rendering of buttons
//     else {
//         return options.fn(this);
//     }
// });

Handlebars.registerHelper('singlestatuchecker', function (product, options) {
  console.group('helper called with product',product)
  if (product.isReturned) {
      return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Returned</span>');
  } else if (product.isCancelled) {
      return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Cancelled</span>');
  } else {
      // Allow rendering of buttons when neither condition is true
      return options.fn(this);
  }
});


  Handlebars.registerHelper('statuchecker', function (value) {
    let returnCount = value.product.filter((elem) => elem.isReturned).length;
    let cancelCount = value.product.filter((elem) => elem.isCancelled).length;
    
    let allCancelled = value.product.every(product => product.isCancelled);
    let allReturned = value.product.every(product => product.isReturned);
    
    // Handle the order statuses
    if (value.status === "Delivered") {
      return new Handlebars.SafeString(`
        <button id="returnOrder" data-order-id="${value._id}" class="btn btn-sm btn-primary">Return Entire Order</button>
      `);
    } else if (value.status === "Returned") {
      return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Order Returned</span>');
    } else if (value.status === "Payment Failed") {
      return new Handlebars.SafeString(`
        <button id="retryPayment" data-order-id="${value._id}" class="btn btn-sm btn-warning">Retry Payment</button>
      `);
    } else {
      if (allCancelled || value.status === 'Cancelled') {
        return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Order Cancelled</span>');
      } else if (returnCount > 0) {
        return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Order Returned</span>');
      } else {
        return new Handlebars.SafeString(`
          <button id="cancelOrder" data-order-id="${value._id}" class="btn btn-sm btn-primary">Cancel Entire Order</button>
        `);
      }
    }
  });

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

Handlebars.registerHelper('isActive', function(route, options) {
  // Get the current URL path
  const currentRoute = window.location.pathname; // or use your routing system variable

  // Check if the current route matches the provided route and return the correct result
  if (currentRoute.includes(route)) {
      return options.fn(this); // Execute the block inside the {{#if}} if the route matches
  } else {
      return options.inverse(this); // Otherwise, execute the {{else}} block
  }
});

Handlebars.registerHelper('equalsObjectId',function(a,b){
  return a.equals(b)
})

  
module.exports = Handlebars;
