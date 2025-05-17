export const examples = [
    {
        name: "Basic Arithmetic",
        code: "(print (+ 1 2 3 4))\n(print (- 10 5))\n(print (* 2 3 4))\n(print (/ 10 2))",
    },
    {
        name: "List Operations",
        code: "(print (list 1 2 3 4))\n(print (car (list 1 2 3)))\n(print (cdr (list 1 2 3)))\n(print (cons 1 (list 2 3)))\n(print (append (list 1 2) (list 3 4)))\n(print (reverse (list 1 2 3)))",
    },
    {
        name: "Factorial Function",
        code: "(defun factorial (n)\n  (if (= n 0)\n      1\n      (* n (factorial (- n 1)))))\n\n(print (factorial 5))",
    },
    {
        name: "Fibonacci Sequence",
        code: "(defun fibonacci (n)\n  (cond ((= n 0) 0)\n        ((= n 1) 1)\n        (t (+ (fibonacci (- n 1))\n              (fibonacci (- n 2))))))\n\n(print (fibonacci 10))",
    },
    {
        name: "Map and Filter",
        code: "(defun square (x) (* x x))\n\n(print (mapcar (quote square) (list 1 2 3 4 5)))\n\n(defun even (x) (= (mod x 2) 0))\n\n(defun filter (fn lst)\n  (cond ((null lst) nil)\n        ((funcall fn (car lst))\n         (cons (car lst) (filter fn (cdr lst))))\n        (t (filter fn (cdr lst)))))\n\n(print (filter (quote even) (list 1 2 3 4 5 6)))",
    },
]